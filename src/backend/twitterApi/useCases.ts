import { ITwitterTokenRepository, TwitterTokenRepository } from '../cookie/repository'
import { getFetchError } from './utils'

const searchParamsToClean = ['tag']

const cleanUrl = (url: string): string => {
  const cleanedUrl = new URL(url)
  searchParamsToClean.forEach(v => cleanedUrl.searchParams.delete(v))
  return cleanedUrl.href
}

const makeTweetEndpoint = (tweetId: string) => `https://api.twitter.com/1.1/statuses/show.json?id=${tweetId}`

const getMediaFromTweet = (tweet: Tweet) => tweet?.extended_entities?.media

const parseVideoInfo = (video_info: VideoInfo): string => {
  const { variants } = video_info

  // bitrate will be fixed to 0 if video is made from gif.
  // variants contains m3u8 info.
  const hiResUrl = variants.reduce((prevV, currV) => {
    if (!prevV?.bitrate) return currV
    if (!currV?.bitrate) return prevV
    return prevV.bitrate < currV.bitrate || currV.bitrate === 0 ? currV : prevV
  }).url

  return cleanUrl(hiResUrl)
}

const TWITTER_AUTH_TOKEN =
  'Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA'

const initHeaders = (tweetId: string, csrfToken: string, guestToken?: string) =>
  new Headers([
    ['Authorization', TWITTER_AUTH_TOKEN],
    ['User-Agent', navigator.userAgent],
    ['Referer', `https://twitter.com/i/web/status/${tweetId}`],
    ['x-twitter-active-user', 'yes'],
    ['x-csrf-token', csrfToken],
    guestToken ? ['x-guest-token', guestToken] : ['x-twitter-auth-type', 'OAuth2Session'],
  ])

const twitterTokenRepo = new TwitterTokenRepository()

class TweetUseCases {
  protected tweet: Tweet = undefined

  constructor(readonly tweetId: string, protected tokenRepo: ITwitterTokenRepository) {}

  async fetchTweet(): Promise<Tweet> {
    if (this.tweet) return this.tweet

    const csrfToken = await twitterTokenRepo.getCsrfToken()
    const guestToken = await twitterTokenRepo.getGuestToken()
    const endpoint = makeTweetEndpoint(this.tweetId)
    const resp = await fetch(endpoint, {
      method: 'GET',
      headers: initHeaders(this.tweetId, csrfToken, guestToken),
      mode: 'cors',
    })

    if (resp.status === 200) {
      const tweet: Tweet = await resp.json()
      this.tweet = tweet
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
    const tweet: Tweet = await this.fetchTweet()
    const medias = getMediaFromTweet(tweet)

    let mediaCatalog: TweetMediaCatalog = {
      images: [],
      videos: [],
    }

    if (medias !== undefined) {
      mediaCatalog = medias.reduce((catalog, media) => {
        catalog.images.push(cleanUrl(media.media_url_https))

        const videoInfo = media?.video_info
        if (videoInfo) catalog.videos.push(parseVideoInfo(videoInfo))

        return catalog
      }, mediaCatalog)
    }

    return mediaCatalog
  }
}
