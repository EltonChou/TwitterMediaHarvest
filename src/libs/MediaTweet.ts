import { TWITTER_AUTH_TOKEN } from '../constants'
import { i18nLocalize } from './chromeApi'
import { FetchErrorReason } from '../typings'

type VideoInfo = {
  aspect_ratio: number[]
  duration_millis: number
  variants: TweetVideoVariant[]
}

type TweetMedia = {
  media_url: string,
  media_url_https: string,
  video_info?: VideoInfo
}

type TweetVideoVariant = {
  bitrate: number,
  url: string,

}

type TweetDetail = {
  globalObjects: {
    tweets: {
      [key: string]: {
        extended_entities: {
          media: TweetMedia[]
        },
      }
    }
  }
}

export default class MediaTweet {
  public tweetId: string
  public token: string
  private header: Headers
  private tweetAPIurl: string

  constructor(tweetId: string, token: string) {
    this.tweetId = tweetId
    this.header = initHeader(token, tweetId)
    this.tweetAPIurl = `https://api.twitter.com/2/timeline/conversation/${tweetId}.json?tweet_mode=extended`
  }

  async fetchMediaList() {
    let mediaList = null
    let errorReason = null

    const mediaResponse = await fetch(this.tweetAPIurl, {
      method: 'GET',
      headers: this.header,
      mode: 'cors',
      cache: 'no-cache',
    })

    const statusCode = mediaResponse.status
    const reason: FetchErrorReason = {
      status: statusCode,
      title: i18nLocalize('fetchFailedUnknownTitle') + statusCode,
      message: i18nLocalize('fetchFailedUnknownMessage'),
    }

    if (statusCode === 200) {
      const detail: TweetDetail = await mediaResponse.json()
      mediaList = this.parseMedias(detail)
    }
    if (statusCode === 429) {
      reason.title = i18nLocalize('fetchFailedTooManyRequestsTitle')
      reason.message = i18nLocalize('fetchFailedTooManyRequestsMessage')

      errorReason = reason
    }

    return { mediaList: mediaList, errorReason: errorReason }
  }

  parseMedias(detail: TweetDetail): string[] {
    const medias =
      detail.globalObjects.tweets[this.tweetId].extended_entities.media

    const [media] = medias

    const VIDEO_INFO = 'video_info'
    const mediaList =
      VIDEO_INFO in media
        ? this.parseVideo(media[VIDEO_INFO])
        : this.parseImage(medias)

    return mediaList
  }

  parseVideo(video_info: VideoInfo): string[] {
    const mediaList = []
    const { variants } = video_info

    let hiRes = 0
    let targetUrl

    for (const variant of variants) {
      const { bitrate, url } = variant
      // bitrate will be 0 if video is made from gif.
      // variants contains m3u8 info.
      const isHigherBitrate = bitrate > hiRes || bitrate === 0
      if (typeof bitrate !== 'undefined' && isHigherBitrate) {
        hiRes = bitrate
        targetUrl = url
      }
    }

    mediaList.push(targetUrl)
    return mediaList
  }

  parseImage(medias: TweetMedia[]): string[] {
    return medias.map(media => media.media_url_https)
  }
}

function initHeader(token: string, tweetId: string) {
  return new Headers([
    ['Authorization', TWITTER_AUTH_TOKEN],
    ['User-Agent', navigator.userAgent],
    ['Referer', `https://twitter.com/i/web/status/${tweetId}`],
    ['cache-control', 'no-cache'],
    ['x-twitter-active-user', 'yes'],
    ['x-twitter-auth-type', 'OAuth2Session'],
    ['x-csrf-token', token],
  ])
}
