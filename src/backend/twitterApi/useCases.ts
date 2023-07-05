import ValueObject from '@backend/valueObject'
import type { Medum2, Tweet, VideoInfo } from 'types/twitter/tweet'
import { ITwitterTokenRepository, TwitterTokenRepository } from '../cookie/repository'
import { getFetchError } from './utils'

type TweetUser = {
  name: string
  screen_name: string
  rest_id: string
}

class TweetVO extends ValueObject<{ tweet: Tweet; user: TweetUser }> {
  constructor(tweet: Tweet, tweetUser: TweetUser) {
    super({ tweet: tweet, user: tweetUser })
  }

  get medias(): Medum2[] {
    return this.props?.tweet.extended_entities?.media
  }

  get id(): string {
    return this.props.tweet.id_str
  }

  get authorName(): string {
    return this.props.user.name
  }

  get authorScreenName(): string {
    return this.props.user.screen_name
  }

  get authorId(): string {
    return this.props.user.rest_id
  }

  get createdAt(): Date {
    return new Date(Date.parse(this.props.tweet.created_at))
  }
}

const searchParamsToClean = ['tag']

const cleanUrl = (url: string): string =>
  searchParamsToClean.reduce((url, tag) => {
    url.searchParams.delete(tag)
    return url
  }, new URL(url)).href

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

const initHeaders = (tweetId: string, csrfToken: string, guestToken?: string) =>
  new Headers([
    [
      'Authorization',
      'Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA',
    ],
    ['User-Agent', navigator.userAgent],
    ['Referer', `https://twitter.com/i/web/status/${tweetId}`],
    ['x-twitter-active-user', 'yes'],
    ['x-csrf-token', csrfToken],
    guestToken ? ['x-guest-token', guestToken] : ['x-twitter-auth-type', 'OAuth2Session'],
  ])

export interface ITweetUseCase {
  fetchTweet(): Promise<TweetVO>
}

const twitterTokenRepo = new TwitterTokenRepository()

abstract class TweetUseCase implements ITweetUseCase {
  protected tokenRepo: ITwitterTokenRepository = twitterTokenRepo
  protected tweet: TweetVO = undefined

  constructor(readonly tweetId: string) {}

  async fetchTweet(): Promise<TweetVO> {
    if (this.tweet) return this.tweet

    const csrfToken = await twitterTokenRepo.getCsrfToken()
    const guestToken = await twitterTokenRepo.getGuestToken()
    const endpoint = this.makeEndpoint()
    const resp = await fetch(endpoint, {
      method: 'GET',
      headers: initHeaders(this.tweetId, csrfToken, guestToken),
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
 */
export class V1TweetUseCase extends TweetUseCase {
  makeEndpoint(): string {
    return `https://api.twitter.com/1.1/statuses/show.json?id=${this.tweetId}?trim_user=true`
  }

  parseBody(object: any): TweetVO {
    object as Tweet
    return new TweetVO(object, {
      name: object.user.name,
      screen_name: object.user.screen_name,
      rest_id: object.user.id_str,
    })
  }
}

/**
 * V2 has larger body, and lower rate limit about 190.
 * @deprecated
 */
class V2TweetUseCase extends TweetUseCase {
  makeEndpoint(): string {
    return `https://api.twitter.com/2/timeline/conversation/${this.tweetId}.json?tweet_mode=extended&trim_user=true`
  }

  parseBody(object: any): TweetVO {
    return new TweetVO(object.globalObjects.tweets[this.tweetId], {} as TweetUser)
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

interface TwitterGraphQLFeatures {
  blue_business_profile_image_shape_enabled: boolean
  responsive_web_graphql_exclude_directive_enabled: boolean
  verified_phone_label_enabled: boolean
  responsive_web_graphql_timeline_navigation_enabled: boolean
  responsive_web_graphql_skip_user_profile_image_extensions_enabled: boolean
  tweetypie_unmention_optimization_enabled: boolean
  vibe_api_enabled: boolean
  responsive_web_edit_tweet_api_enabled: boolean
  graphql_is_translatable_rweb_tweet_is_translatable_enabled: boolean
  view_counts_everywhere_api_enabled: boolean
  longform_notetweets_consumption_enabled: boolean
  tweet_awards_web_tipping_enabled: boolean
  freedom_of_speech_not_reach_fetch_enabled: boolean
  standardized_nudges_misinfo: boolean
  tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: boolean
  interactive_text_enabled: boolean
  responsive_web_text_conversations_enabled: boolean
  longform_notetweets_rich_text_read_enabled: boolean
  responsive_web_enhance_cards_enabled: boolean
}

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

const graphQlFeatures: TwitterGraphQLFeatures = {
  blue_business_profile_image_shape_enabled: false,
  responsive_web_graphql_exclude_directive_enabled: false,
  verified_phone_label_enabled: false,
  responsive_web_graphql_timeline_navigation_enabled: false,
  responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
  tweetypie_unmention_optimization_enabled: false,
  vibe_api_enabled: false,
  responsive_web_edit_tweet_api_enabled: false,
  graphql_is_translatable_rweb_tweet_is_translatable_enabled: false,
  view_counts_everywhere_api_enabled: false,
  longform_notetweets_consumption_enabled: false,
  tweet_awards_web_tipping_enabled: false,
  freedom_of_speech_not_reach_fetch_enabled: false,
  standardized_nudges_misinfo: false,
  tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: false,
  interactive_text_enabled: false,
  responsive_web_text_conversations_enabled: false,
  longform_notetweets_rich_text_read_enabled: false,
  responsive_web_enhance_cards_enabled: false,
}

/**
 * GraphQL experiment implement.
 */
export class GraphQLTweetUseCase extends TweetUseCase {
  makeEndpoint(): string {
    const endpoint = new URL('https://twitter.com/i/api/graphql/BbCrSoXIR7z93lLCVFlQ2Q/TweetDetail')
    endpoint.searchParams.append('variables', JSON.stringify(makeGraphQlVars(this.tweetId)))
    endpoint.searchParams.append('features', JSON.stringify(graphQlFeatures))
    return endpoint.href
  }

  parseBody(object: any): TweetVO {
    const entry = object.data.threaded_conversation_with_injections_v2.instructions
      .filter((i: { type: string }) => i.type === 'TimelineAddEntries')[0]
      .entries.filter((e: { entryId: string }) => e.entryId.includes(this.tweetId))[0]

    const tweet =
      entry.content.itemContent.tweet_results.result.legacy ||
      entry.content.itemContent.tweet_results.result.tweet.legacy

    const user = entry.content.itemContent.tweet_results.result.core.user_results.result

    if (!tweet) throw getFetchError(404)

    return new TweetVO(tweet, {
      screen_name: user.legacy.screen_name,
      name: user.legacy.name,
      rest_id: user.rest_id,
    })
  }
}

export class MediaTweetUseCases {
  constructor(readonly tweetUseCase: ITweetUseCase) {}

  async fetchMediaCatalog(): Promise<TweetMediaCatalog> {
    const tweet = await this.tweetUseCase.fetchTweet()
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

    return mediaCatalog
  }
}
