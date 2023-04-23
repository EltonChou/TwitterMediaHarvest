import ValueObject from '@backend/valueObject'
import { ITwitterTokenRepository, TwitterTokenRepository } from '../cookie/repository'
import { getFetchError } from './utils'

class TweetVO extends ValueObject<Tweet> {
  constructor(tweet: Tweet) {
    super(tweet)
  }

  getMedias(): Medum2[] {
    return this.props?.extended_entities?.media
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
    if (!prevV?.bitrate) return currV
    if (!currV?.bitrate) return prevV
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

const twitterTokenRepo = new TwitterTokenRepository()

abstract class TweetUseCase {
  protected tweet: TweetVO = undefined

  constructor(readonly tweetId: string, protected tokenRepo: ITwitterTokenRepository) {}

  /**
   * Though the v1.1 api has shorter response time,
   * the legacy api might be deprecated soon.
   *
   * - V1.1 API endpoint: {@link makeV1TweetEndpoint}
   * - V2 API endpoint: {@link makeV2TweetEndpoint}
   */
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
class V1TweetUseCase extends TweetUseCase {
  makeEndpoint(): string {
    return `https://api.twitter.com/1.1/statuses/show.json?id=${this.tweetId}?trim_user=true`
  }

  parseBody(object: any): TweetVO {
    object as Tweet
    return new TweetVO(object)
  }
}

/**
 * V2 has larger body, and lower rate limit about 190.
 */
class V2TweetUseCase extends TweetUseCase {
  makeEndpoint(): string {
    return `https://api.twitter.com/2/timeline/conversation/${this.tweetId}.json?tweet_mode=extended&trim_user=true`
  }

  parseBody(object: any): TweetVO {
    return new TweetVO(object.globalObjects.tweets[this.tweetId])
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

class GraphQLTweetUseCase extends TweetUseCase {
  makeEndpoint(): string {
    const endpoint = new URL('https://twitter.com/i/api/graphql/BbCrSoXIR7z93lLCVFlQ2Q/TweetDetail')
    endpoint.searchParams.append('variables', JSON.stringify(makeGraphQlVars(this.tweetId)))
    endpoint.searchParams.append('features', JSON.stringify(graphQlFeatures))
    return endpoint.href
  }

  parseBody(object: any): TweetVO {
    const tweet =
      object.data.threaded_conversation_with_injections_v2.instructions[0].entries[0].content.itemContent.tweet_results
        .result.legacy

    return new TweetVO(tweet)
  }
}

export class MediaTweetUseCases extends GraphQLTweetUseCase {
  constructor(tweetId: string) {
    super(tweetId, twitterTokenRepo)
  }

  async fetchMediaCatalog(): Promise<TweetMediaCatalog> {
    const tweet = await this.fetchTweet()
    const medias = tweet.getMedias()

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
