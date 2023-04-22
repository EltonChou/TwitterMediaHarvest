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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const makeV1TweetEndpoint = (tweetId: string) =>
  `https://api.twitter.com/1.1/statuses/show.json?id=${tweetId}?trim_user=true`

const makeV2TweetEndpoint = (tweetId: string) =>
  `https://api.twitter.com/2/timeline/conversation/${tweetId}.json?tweet_mode=extended&trim_user=true`

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

class TweetUseCases {
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
    const endpoint = makeV2TweetEndpoint(this.tweetId)
    const resp = await fetch(endpoint, {
      method: 'GET',
      headers: initHeaders(this.tweetId, csrfToken, guestToken),
      mode: 'cors',
    })

    if (resp.status === 200) {
      const body = await resp.json()
      const tweet: Tweet = body?.globalObjects ? body.globalObjects.tweets[this.tweetId] : body
      this.tweet = new TweetVO(tweet)
      return this.tweet
    }

    throw getFetchError(resp.status)
  }
}

export class MediaTweetUseCases extends TweetUseCases {
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
