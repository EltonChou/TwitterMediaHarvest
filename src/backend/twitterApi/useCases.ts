import { TweetMediaParsingError, TweetParsingError, TweetUserParsingError } from '@backend/errors'
import { TwitterApiVersion } from '@schema'
import type { VideoInfo } from 'types/twitter/tweet'
import { ITwitterTokenRepository, TwitterTokenRepository } from '../cookie/repositories'
import { getFetchError } from './utils'
import { TweetVO } from './valueObjects'

const searchParamsToClean = ['tag']

const cleanUrl = (url: string): string => {
  const theUrl = new URL(url)
  searchParamsToClean.forEach(param => theUrl.searchParams.delete(param))
  return theUrl.href
}

const getBestQualityVideoUrl = (video_info: VideoInfo): string => {
  // bitrate will be fixed to 0 if video is made from gif.
  // variants contains m3u8 info.
  const hiResUrl = video_info.variants.reduce((prevV, currV) => {
    if (prevV?.bitrate === undefined) return currV
    if (currV?.bitrate === undefined) return prevV
    return prevV.bitrate < currV.bitrate || currV.bitrate === 0 ? currV : prevV
  }).url

  return cleanUrl(hiResUrl)
}

const initHeaders = (tweetId: string, bearerToken: string, csrfToken: string, guestToken?: string) =>
  new Headers([
    ['Content-Type', 'application/json'],
    ['Authorization', 'Bearer ' + bearerToken],
    ['User-Agent', navigator.userAgent],
    ['Referer', `https://twitter.com/i/web/status/${tweetId}`],
    ['x-twitter-active-user', 'yes'],
    ['x-csrf-token', csrfToken],
    guestToken ? ['x-guest-token', guestToken] : ['x-twitter-auth-type', 'OAuth2Session'],
  ])

export interface ITweetUseCase {
  version: TwitterApiVersion
  fetchTweet(): Promise<TweetVO>
}

const twitterTokenRepo = new TwitterTokenRepository()

abstract class TweetUseCase implements ITweetUseCase {
  abstract version: TwitterApiVersion

  protected tokenRepo: ITwitterTokenRepository = twitterTokenRepo
  protected tweet: TweetVO = undefined
  protected bearerToken =
    'AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA'

  constructor(readonly tweetId: string) {}

  async fetchTweet(headers?: HeadersInit): Promise<TweetVO> {
    if (this.tweet) return this.tweet

    const csrfToken = await twitterTokenRepo.getCsrfToken()
    const guestToken = await twitterTokenRepo.getGuestToken()
    const endpoint = this.makeEndpoint()
    const resp = await fetch(endpoint, {
      method: 'GET',
      headers: headers || initHeaders(this.tweetId, this.bearerToken, csrfToken, guestToken),
      mode: 'cors',
    })

    if (resp.status === 200) {
      const body = await resp.json()
      this.tweet = this.parseBody(body)
      return this.tweet
    }

    throw getFetchError(resp.status)
  }

  abstract makeEndpoint(): string
  abstract parseBody(object: any): TweetVO
}

/**
 * V1 has faster response time and higer rate limit about 1000,  but it might be deprecated soon.
 * @deprecated
 */
export class V1TweetUseCase extends TweetUseCase {
  version: TwitterApiVersion = 'v1'

  makeEndpoint(): string {
    return `https://api.twitter.com/1.1/statuses/show.json?id=${this.tweetId}&tweet_mode=extended`
  }

  parseBody(object: any): TweetVO {
    if (!object) throw new TweetParsingError('Cannot parse tweet from response.')
    if (!object.user) throw new TweetUserParsingError('Cannot parse tweet user from response.')

    return new TweetVO(object, {
      name: object.user.name,
      screen_name: object.user.screen_name,
      rest_id: object.user.id_str,
    })
  }
}

export class V2TweetUseCase extends TweetUseCase {
  version: TwitterApiVersion = 'v2'

  protected bearerToken =
    'AAAAAAAAAAAAAAAAAAAAAF7aAAAAAAAAS' +
    'CiRjWvh7R5wxaKkFp7MM%2BhYBqM%3DbQ0JPmjU9F6ZoMhDfI4uTNAaQuTDm2uO9x3WFVr2xBZ2nhjdP0'

  makeEndpoint(): string {
    return `https://api.twitter.com/2/timeline/conversation/${this.tweetId}.json?tweet_mode=extended`
  }

  parseBody(object: any): TweetVO {
    const tweet = object.globalObjects.tweets[this.tweetId]
    if (!tweet) throw new TweetParsingError('Cannot parse tweet from response.')

    const user = object.globalObjects.users[tweet.user_id_str]
    if (!user) throw new TweetUserParsingError('Cannot parse tweet user from response.')

    return new TweetVO(tweet, {
      name: user.name,
      screen_name: user.screen_name,
      rest_id: user.id_str,
    })
  }
}

const makeGraphQlVars = (tweetId: string): TwitterGraphQLVariables => ({
  focalTweetId: tweetId,
  with_rux_injections: false,
  includePromotedContent: false,
  withCommunity: false,
  withQuickPromoteEligibilityTweetFields: false,
  withBirdwatchNotes: false,
  withVoice: false,
  withV2Timeline: true,
})

interface TwitterGraphQLVariables {
  focalTweetId: string
  with_rux_injections: boolean
  includePromotedContent: boolean
  withCommunity: boolean
  withQuickPromoteEligibilityTweetFields: boolean
  withBirdwatchNotes: boolean
  withVoice: boolean
  withV2Timeline: boolean
}

abstract class GraphQLTweetUseCase extends TweetUseCase {
  version: TwitterApiVersion = 'gql'

  abstract makeEndpoint(): string

  parseBody(object: any): TweetVO {
    if ('errors' in object) throw getFetchError(404)

    const entry = object.data.threaded_conversation_with_injections_v2.instructions
      .filter((i: { type: string }) => i.type === 'TimelineAddEntries')[0]
      .entries.filter((e: { entryId: string }) => e.entryId.includes(this.tweetId))[0]

    const result =
      entry.content.itemContent.tweet_results.result.tweet || entry.content.itemContent.tweet_results.result

    const tweet = result?.legacy || result
    if (!tweet) throw new TweetParsingError('Cannot parse tweet from response.')

    const user = result?.core?.user_results?.result
    if (!user) throw new TweetUserParsingError('Cannot parse tweet user from response.')

    return new TweetVO(tweet, {
      screen_name: user.legacy.screen_name,
      name: user.legacy.name,
      rest_id: user.rest_id,
    })
  }
}

/**
 * Works fine for few months, but who knows.
 */
export class FallbackGraphQLTweetUseCase extends GraphQLTweetUseCase {
  version: TwitterApiVersion = 'gql-f'

  makeEndpoint(): string {
    const endpoint = new URL('https://twitter.com/i/api/graphql/BbCrSoXIR7z93lLCVFlQ2Q/TweetDetail')
    endpoint.searchParams.append('variables', JSON.stringify(makeGraphQlVars(this.tweetId)))
    endpoint.searchParams.append(
      'features',
      JSON.stringify({
        blue_business_profile_image_shape_enabled: false,
        responsive_web_graphql_exclude_directive_enabled: true,
        verified_phone_label_enabled: false,
        responsive_web_graphql_timeline_navigation_enabled: false,
        responsive_web_graphql_skip_user_profile_image_extensions_enabled: true,
        tweetypie_unmention_optimization_enabled: false,
        vibe_api_enabled: false,
        responsive_web_edit_tweet_api_enabled: false,
        graphql_is_translatable_rweb_tweet_is_translatable_enabled: false,
        view_counts_everywhere_api_enabled: false,
        longform_notetweets_consumption_enabled: false,
        tweet_awards_web_tipping_enabled: false,
        freedom_of_speech_not_reach_fetch_enabled: false,
        standardized_nudges_misinfo: false,
        tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: true,
        interactive_text_enabled: false,
        responsive_web_text_conversations_enabled: false,
        longform_notetweets_rich_text_read_enabled: false,
        responsive_web_enhance_cards_enabled: false,
      })
    )
    return endpoint.href
  }
}

export class LatestGraphQLTweetUseCase extends GraphQLTweetUseCase {
  makeEndpoint(): string {
    const endpoint = new URL('https://twitter.com/i/api/graphql/-Ls3CrSQNo2fRKH6i6Na1A/TweetDetail')
    endpoint.searchParams.append('variables', JSON.stringify(makeGraphQlVars(this.tweetId)))
    endpoint.searchParams.append(
      'features',
      JSON.stringify({
        rweb_lists_timeline_redesign_enabled: true,
        responsive_web_graphql_exclude_directive_enabled: true,
        verified_phone_label_enabled: false,
        creator_subscriptions_tweet_preview_api_enabled: false,
        responsive_web_graphql_timeline_navigation_enabled: false,
        responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
        tweetypie_unmention_optimization_enabled: true,
        responsive_web_edit_tweet_api_enabled: false,
        graphql_is_translatable_rweb_tweet_is_translatable_enabled: false,
        view_counts_everywhere_api_enabled: false,
        longform_notetweets_consumption_enabled: false,
        responsive_web_twitter_article_tweet_consumption_enabled: false,
        tweet_awards_web_tipping_enabled: false,
        freedom_of_speech_not_reach_fetch_enabled: false,
        standardized_nudges_misinfo: false,
        tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: true,
        longform_notetweets_rich_text_read_enabled: false,
        longform_notetweets_inline_media_enabled: false,
        responsive_web_media_download_video_enabled: false,
        responsive_web_enhance_cards_enabled: false,
      })
    )
    endpoint.searchParams.append(
      'fieldToggles',
      JSON.stringify({ withArticleRichContentState: false, withAuxiliaryUserLabels: false })
    )
    return endpoint.href
  }
}

export class GuestGraphQLTweetUseCase extends GraphQLTweetUseCase {
  makeEndpoint(): string {
    const endpoint = new URL('https://twitter.com/i/api/graphql/0hWvDhmW8YQ-S_ib3azIrw/TweetResultByRestId')
    endpoint.searchParams.append(
      'variables',
      JSON.stringify({
        tweetId: this.tweetId,
        withCommunity: false,
        includePromotedContent: false,
        withVoice: false,
      })
    )
    endpoint.searchParams.append(
      'features',
      JSON.stringify({
        creator_subscriptions_tweet_preview_api_enabled: false,
        tweetypie_unmention_optimization_enabled: true,
        responsive_web_edit_tweet_api_enabled: true,
        graphql_is_translatable_rweb_tweet_is_translatable_enabled: false,
        view_counts_everywhere_api_enabled: false,
        longform_notetweets_consumption_enabled: true,
        responsive_web_twitter_article_tweet_consumption_enabled: false,
        tweet_awards_web_tipping_enabled: false,
        freedom_of_speech_not_reach_fetch_enabled: true,
        standardized_nudges_misinfo: false,
        tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: true,
        longform_notetweets_rich_text_read_enabled: false,
        longform_notetweets_inline_media_enabled: false,
        responsive_web_graphql_exclude_directive_enabled: true,
        verified_phone_label_enabled: false,
        responsive_web_media_download_video_enabled: false,
        responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
        responsive_web_graphql_timeline_navigation_enabled: false,
        responsive_web_enhance_cards_enabled: false,
      })
    )
    endpoint.searchParams.append(
      'fieldToggles',
      JSON.stringify({ withArticleRichContentState: false, withAuxiliaryUserLabels: false })
    )
    return endpoint.href
  }

  parseBody(object: any): TweetVO {
    const tweet = object.data.tweetResult.result.legacy
    if (!tweet) throw new TweetParsingError('Cannot parse tweet from response.')

    const user = object.data.tweetResult.result.core.user_results.result
    if (!user) throw new TweetUserParsingError('Cannot parse tweet user from response.')

    return new TweetVO(tweet, {
      screen_name: user.legacy.screen_name,
      name: user.legacy.name,
      rest_id: user.rest_id,
    })
  }
}

export class MediaTweetUseCases {
  constructor(readonly tweetUseCase: ITweetUseCase) {}

  async fetchTweet(): Promise<TweetVO> {
    return await this.tweetUseCase.fetchTweet()
  }

  async fetchMediaCatalog(): Promise<TweetMediaCatalog> {
    const tweet = await this.fetchTweet()
    const medias = tweet.medias

    let mediaCatalog: TweetMediaCatalog = {
      images: [],
      videos: [],
    }

    if (medias !== undefined) {
      mediaCatalog = medias.reduce((catalog, media) => {
        catalog.images.push(cleanUrl(media.media_url_https))
        media?.video_info && catalog.videos.push(getBestQualityVideoUrl(media.video_info))
        return catalog
      }, mediaCatalog)
    }

    if (isEmptyMediaCatalog(mediaCatalog))
      throw new TweetMediaParsingError('Cannot parse media from tweet. ' + JSON.stringify({ tweetId: tweet.id }))

    return mediaCatalog
  }
}

const isEmptyMediaCatalog = (catalog: TweetMediaCatalog) => Object.values(catalog).every(medias => medias.length === 0)

export const createAllApiUseCasesByTweetId = (tweetId: string): ITweetUseCase[] => [
  new V2TweetUseCase(tweetId),
  new LatestGraphQLTweetUseCase(tweetId),
  new FallbackGraphQLTweetUseCase(tweetId),
  new GuestGraphQLTweetUseCase(tweetId),
]

export const sortUseCasesByVersion =
  (useCases: ITweetUseCase[]) =>
  (priorityVersion: TwitterApiVersion): ITweetUseCase[] =>
    [...useCases].sort((a, b) => {
      if (a.version === priorityVersion) return -1
      if (b.version === priorityVersion) return 1
      return 0
    })
