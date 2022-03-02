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

const VIDEO_INFO = 'video_info'

export const fetchMediaList = async (tweetId: string, token: string): Promise<string[]> => {
  const endpoint = makeTweetEndpoint(tweetId)
  const mediaResponse = await fetch(endpoint, {
    method: 'GET',
    headers: initHeader(token, tweetId),
    mode: 'cors',
    cache: 'no-cache',
  })

  const statusCode = mediaResponse.status
  return new Promise((resolve, reject) => {
    if (statusCode === 200) {
      mediaResponse.json().then(
        (detail: TweetDetail) => {
          const medias = getMediaFromDetailByTweetId(detail)(tweetId)
          const leadMedia = getLeadMedia(medias)
          const mediaList = isVideo(leadMedia)
            ? parseVideo(leadMedia[VIDEO_INFO])
            : parseImage(medias)
          resolve(mediaList)
        }
      )
    }

    if (statusCode === 429) {
      const reason: FetchErrorReason = {
        status: statusCode,
        title: i18nLocalize('fetchFailedUnknownTitle') + statusCode,
        message: i18nLocalize('fetchFailedUnknownMessage'),
      }
      reason.title = i18nLocalize('fetchFailedTooManyRequestsTitle')
      reason.message = i18nLocalize('fetchFailedTooManyRequestsMessage')

      reject(reason)
    }
  })
}

const makeTweetEndpoint = (tweetId: string) => `https://api.twitter.com/2/timeline/conversation/${tweetId}.json?tweet_mode=extended`
const getMediaFromDetailByTweetId = (detail: TweetDetail) =>
  (tweetId: string): TweetMedia[] => detail.globalObjects.tweets[tweetId].extended_entities.media
const getLeadMedia = ([media]: TweetMedia[]) => media
const isVideo = (media: TweetMedia) => VIDEO_INFO in media
const parseImage = (medias: TweetMedia[]): string[] => medias.map(media => media.media_url_https)
const parseVideo = (video_info: VideoInfo): string[] => {
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


const initHeader = (token: string, tweetId: string) =>
  new Headers([
    ['Authorization', TWITTER_AUTH_TOKEN],
    ['User-Agent', navigator.userAgent],
    ['Referer', `https://twitter.com/i/web/status/${tweetId}`],
    ['cache-control', 'no-cache'],
    ['x-twitter-active-user', 'yes'],
    ['x-twitter-auth-type', 'OAuth2Session'],
    ['x-csrf-token', token],
  ])
