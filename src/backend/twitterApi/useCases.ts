import {
  ITwitterTokenRepository,
  TwitterTokenRepository,
  XTokenRepository,
} from '../cookie/repositories'
import { getFetchError } from './utils'
import { TweetVO } from './valueObjects'
import {
  TweetMediaParsingError,
  TweetParsingError,
  TweetUserParsingError,
} from '@backend/errors'
import { TwitterApiVersion } from '@schema'
import type { VideoInfo } from 'types/twitter/tweet'

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

const initHeaders = (
  tweetId: string,
  bearerToken: string,
  csrfToken: string,
  guestToken?: string
) =>
  new Headers([
    ['Content-Type', 'application/json'],
    ['Authorization', 'Bearer ' + bearerToken],
    ['User-Agent', navigator.userAgent],
    ['Referer', `https://x.com/i/web/status/${tweetId}`],
    ['x-twitter-active-user', 'yes'],
    ['x-csrf-token', csrfToken],
    guestToken ? ['x-guest-token', guestToken] : ['x-twitter-auth-type', 'OAuth2Session'],
  ])

export interface ITweetUseCase {
  version: TwitterApiVersion
  fetchTweet(): Promise<TweetVO>
}

const xTokenRepo = new XTokenRepository()
const twitterTokenRepo = new TwitterTokenRepository()

type TwitterDomain = 'twitter.com' | 'x.com'

abstract class TweetUseCase implements ITweetUseCase {
  abstract version: TwitterApiVersion

  protected domain: TwitterDomain = 'x.com'
  protected tokenRepo: ITwitterTokenRepository = xTokenRepo
  protected tweet: TweetVO = undefined
  protected bearerToken =
    'AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA'

  constructor(readonly tweetId: string) {}

  abstract makeEndpoint(): string

  async fetchTweet(headers?: HeadersInit): Promise<TweetVO> {
    if (this.tweet) return this.tweet

    const csrfToken = await this.tokenRepo.getCsrfToken()
    const guestToken = await this.tokenRepo.getGuestToken()
    const endpoint = this.makeEndpoint()
    const resp = await fetch(endpoint, {
      method: 'GET',
      headers:
        headers || initHeaders(this.tweetId, this.bearerToken, csrfToken, guestToken),
      mode: 'cors',
    })

    if (resp.status === 200) {
      const body = await resp.json()
      this.tweet = this.parseBody(body)
      return this.tweet
    }

    throw getFetchError(resp.status)
  }

  parseBody(object: any): TweetVO {
    if ('errors' in object) throw getFetchError(404)

    const entry = object.data.threaded_conversation_with_injections_v2.instructions
      .filter((i: { type: string }) => i.type === 'TimelineAddEntries')[0]
      .entries.filter((e: { entryId: string }) => e.entryId.includes(this.tweetId))[0]

    const result =
      entry.content.itemContent.tweet_results.result.tweet ||
      entry.content.itemContent.tweet_results.result

    const tweet = result?.legacy || result
    if (!tweet) throw new TweetParsingError('Cannot parse tweet from response.')

    const user = result?.core?.user_results?.result
    if (!user) throw new TweetUserParsingError('Cannot parse tweet user from response.')

    return new TweetVO(tweet, {
      screen_name: user.legacy.screen_name,
      name: user.legacy.name,
      rest_id: user.rest_id,
      protected: Boolean(user?.legacy?.protected),
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

const makeLatestEndpoint = (domain: TwitterDomain, tweetId: string): string => {
  const endpoint = new URL(
    `https://${domain}/i/api/graphql/zJvfJs3gSbrVhC0MKjt_OQ/TweetDetail`
  )
  endpoint.searchParams.append('variables', JSON.stringify(makeGraphQlVars(tweetId)))
  endpoint.searchParams.append(
    'features',
    JSON.stringify({
      rweb_tipjar_consumption_enabled: false,
      responsive_web_graphql_exclude_directive_enabled: false,
      verified_phone_label_enabled: false,
      creator_subscriptions_tweet_preview_api_enabled: false,
      responsive_web_graphql_timeline_navigation_enabled: false,
      responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
      communities_web_enable_tweet_community_results_fetch: false,
      c9s_tweet_anatomy_moderator_badge_enabled: false,
      articles_preview_enabled: true,
      tweetypie_unmention_optimization_enabled: false,
      responsive_web_edit_tweet_api_enabled: false,
      graphql_is_translatable_rweb_tweet_is_translatable_enabled: false,
      view_counts_everywhere_api_enabled: false,
      longform_notetweets_consumption_enabled: false,
      responsive_web_twitter_article_tweet_consumption_enabled: false,
      tweet_awards_web_tipping_enabled: false,
      creator_subscriptions_quote_tweet_preview_enabled: false,
      freedom_of_speech_not_reach_fetch_enabled: false,
      standardized_nudges_misinfo: false,
      tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: false,
      tweet_with_visibility_results_prefer_gql_media_interstitial_enabled: false,
      rweb_video_timestamps_enabled: false,
      longform_notetweets_rich_text_read_enabled: false,
      longform_notetweets_inline_media_enabled: false,
      responsive_web_enhance_cards_enabled: false,
    })
  )
  endpoint.searchParams.append(
    'fieldToggles',
    JSON.stringify({
      withArticleRichContentState: false,
      withAuxiliaryUserLabels: false,
    })
  )
  return endpoint.href
}

const makeFallbackEndpoint = (domain: TwitterDomain, tweetId: string): string => {
  const endpoint = new URL(
    `https://${domain}/i/api/graphql/BbCrSoXIR7z93lLCVFlQ2Q/TweetDetail`
  )
  endpoint.searchParams.append('variables', JSON.stringify(makeGraphQlVars(tweetId)))
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

const makeGuestEndpoint = (domain: TwitterDomain, tweetId: string): string => {
  const endpoint = new URL(
    `https://${domain}/i/api/graphql/0hWvDhmW8YQ-S_ib3azIrw/TweetResultByRestId`
  )
  endpoint.searchParams.append(
    'variables',
    JSON.stringify({
      tweetId: tweetId,
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
    JSON.stringify({
      withArticleRichContentState: false,
      withAuxiliaryUserLabels: false,
    })
  )
  return endpoint.href
}

class LatestGraphQLTweetUseCase extends TweetUseCase {
  version: TwitterApiVersion = 'gql'

  makeEndpoint(): string {
    return makeLatestEndpoint(this.domain, this.tweetId)
  }
}

class LatestTwitterGraphQLTweetUseCase extends LatestGraphQLTweetUseCase {
  version: TwitterApiVersion = 'gql-twitter'
  protected domain: TwitterDomain = 'twitter.com'
  protected tokenRepo: ITwitterTokenRepository = twitterTokenRepo
}

class GuestGraphQLTweetUseCase extends TweetUseCase {
  version: TwitterApiVersion = 'gql-guest'

  makeEndpoint(): string {
    return makeGuestEndpoint(this.domain, this.tweetId)
  }

  parseBody(object: any): TweetVO {
    const tweet = object.data.tweetResult?.result?.legacy
    if (!tweet) throw new TweetParsingError('Cannot parse tweet from response.')

    const user = object.data.tweetResult?.result?.core?.user_results?.result
    if (!user) throw new TweetUserParsingError('Cannot parse tweet user from response.')

    return new TweetVO(tweet, {
      screen_name: user.legacy.screen_name,
      name: user.legacy.name,
      rest_id: user.rest_id,
      protected: Boolean(user?.legacy?.protected),
    })
  }
}

class GuestTwitterGraphQLTweetUseCase extends GuestGraphQLTweetUseCase {
  version: TwitterApiVersion = 'gql-guest-twitter'
  protected domain: TwitterDomain = 'twitter.com'
  protected tokenRepo: ITwitterTokenRepository = twitterTokenRepo
}

/**
 * Works fine for few months, but who knows.
 */
class FallbackGraphQLTweetUseCase extends TweetUseCase {
  version: TwitterApiVersion = 'gql-fallback'

  makeEndpoint(): string {
    return makeFallbackEndpoint(this.domain, this.tweetId)
  }
}

class FallbackTwitterGraphQLTweetUseCase extends FallbackGraphQLTweetUseCase {
  version: TwitterApiVersion = 'gql-fallback-twitter'
  protected domain: TwitterDomain = 'twitter.com'
  protected tokenRepo: ITwitterTokenRepository = twitterTokenRepo
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
      throw new TweetMediaParsingError(
        'Cannot parse media from tweet. ' + JSON.stringify({ tweetId: tweet.id })
      )

    return mediaCatalog
  }
}

const isEmptyMediaCatalog = (catalog: TweetMediaCatalog) =>
  Object.values(catalog).every(medias => medias.length === 0)

export const createAllApiUseCasesByTweetId = (tweetId: string): ITweetUseCase[] => [
  new LatestGraphQLTweetUseCase(tweetId),
  new LatestTwitterGraphQLTweetUseCase(tweetId),
  new FallbackGraphQLTweetUseCase(tweetId),
  new FallbackTwitterGraphQLTweetUseCase(tweetId),
  new GuestGraphQLTweetUseCase(tweetId),
  new GuestTwitterGraphQLTweetUseCase(tweetId),
]

export const sortUseCasesByVersion =
  (priorityVersion: TwitterApiVersion) =>
  (useCases: ITweetUseCase[]): ITweetUseCase[] =>
    [...useCases].sort((a, b) => {
      if (a.version === priorityVersion) return -1
      if (b.version === priorityVersion) return 1
      return 0
    })
