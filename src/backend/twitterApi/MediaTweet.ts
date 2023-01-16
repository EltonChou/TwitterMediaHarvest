import { TWITTER_AUTH_TOKEN } from '../../constants'
import { i18nLocalize } from '../../libs/chromeApi'
import { TwitterCookiesUseCase } from '../cookie/useCases'
import { NotFound, TooManyRequest, TwitterApiError, UnknownError } from '../errors'

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

const twitterCookieUseCase = new TwitterCookiesUseCase

const getFetchError = (statusCode: number): TwitterApiError => {
  if (statusCode === 429) {
    const reason: FetchErrorReason = {
      status: statusCode,
      title: i18nLocalize('fetchFailedTooManyRequestsTitle'),
      message: i18nLocalize('fetchFailedTooManyRequestsMessage'),
    }
    return new TooManyRequest(reason)

  }

  else if (statusCode === 404) {
    const reason: FetchErrorReason = {
      status: statusCode,
      title: i18nLocalize('fetchFailedNotFoundTitle'),
      message: i18nLocalize('fetchFailedNotFoundMessage'),
    }
    return new NotFound(reason)
  }

  const reason: FetchErrorReason = {
    status: statusCode,
    title: i18nLocalize('fetchFailedUnknownTitle') + statusCode,
    message: i18nLocalize('fetchFailedUnknownMessage'),
  }

  return new UnknownError(reason)
}

export const fetchMediaCatalog = async (tweetId: string): Promise<TweetMediaCatalog> => {
  const token = await twitterCookieUseCase.getCt0()
  const endpoint = makeTweetEndpoint(tweetId)
  const mediaResponse = await fetch(endpoint, {
    method: 'GET',
    headers: initHeader(token, tweetId),
    mode: 'cors',
    cache: 'no-cache',
  })

  if (mediaResponse.status === 200) {
    const detail: TweetDetail = await mediaResponse.json()
    const medias = getMediaFromDetailByTweetId(detail)(tweetId)
    const image_list = parseImage(medias)
    const video_list = parseVideo(medias)
    const mediaCatalog: TweetMediaCatalog = {
      images: image_list,
      videos: video_list
    }
    return mediaCatalog
  }

  const err = getFetchError(mediaResponse.status)
  throw err
}


const VIDEO_INFO = 'video_info'
/**
 * Clean all searchParams
 */
const cleanUrl = (url: URL): URL => {
  url.searchParams.delete('tag')
  return url
}
const makeTweetEndpoint = (tweetId: string) =>
  `https://api.twitter.com/2/timeline/conversation/${tweetId}.json?tweet_mode=extended`

const getMediaFromDetailByTweetId = (detail: TweetDetail) =>
  (tweetId: string): TweetMedia[] => detail.globalObjects.tweets[tweetId].extended_entities.media

const isVideo = (media: TweetMedia) => VIDEO_INFO in media

const getVideoInfo = (tweetMedia: TweetMedia): VideoInfo | null => (
  isVideo(tweetMedia) ? tweetMedia.video_info : null
)

const parseImage = (medias: TweetMedia[]): string[] =>
  medias.map(media => cleanUrl(new URL(media.media_url_https)).href)

const parseVideo = (medias: TweetMedia[]): string[] => {
  const mediaList: string[] = []
  for (const media of medias) {
    const videoInfo = getVideoInfo(media)
    if (videoInfo) {
      mediaList.push(parseVideoInfo(videoInfo))
    }
  }
  return mediaList
}

const parseVideoInfo = (video_info: VideoInfo): string => {
  const { variants } = video_info

  let hiRes = 0
  let targetUrl: URL

  for (const variant of variants) {
    const { bitrate, url } = variant
    // bitrate will be 0 if video is made from gif.
    // variants contains m3u8 info.
    const isHigherBitrate = bitrate > hiRes || bitrate === 0
    if (typeof bitrate !== 'undefined' && isHigherBitrate) {
      hiRes = bitrate
      targetUrl = new URL(url)
      targetUrl = cleanUrl(targetUrl)
    }
  }

  return targetUrl.href
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
