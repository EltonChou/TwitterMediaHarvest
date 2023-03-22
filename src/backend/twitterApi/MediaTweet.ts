import browser from 'webextension-polyfill'
import { TwitterTokenRepository } from '../cookie/repository'
import { NotFound, TooManyRequest, TwitterApiError, Unauthorized, UnknownError } from '../errors'

type VideoInfo = {
  aspect_ratio: number[]
  duration_millis: number
  variants: TweetVideoVariant[]
}

type TweetMedia = {
  media_url: string
  media_url_https: string
  video_info?: VideoInfo
}

type TweetVideoVariant = {
  bitrate: number
  url: string
}

type TweetDetail = {
  globalObjects: {
    tweets: {
      [key: string]: {
        extended_entities?: {
          media?: TweetMedia[]
        }
      }
    }
  }
}

const TWITTER_AUTH_TOKEN =
  'Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA'

const twitterTokenRepo = new TwitterTokenRepository()

const i18nLocalize = (kw: string) => browser.i18n.getMessage(kw)

const getFetchError = (statusCode: number): TwitterApiError => {
  if (statusCode === 429) {
    const reason: FetchErrorReason = {
      status: statusCode,
      title: i18nLocalize('fetchFailedTooManyRequestsTitle'),
      message: i18nLocalize('fetchFailedTooManyRequestsMessage'),
    }
    return new TooManyRequest(reason)
  }

  if (statusCode === 404) {
    const reason: FetchErrorReason = {
      status: statusCode,
      title: i18nLocalize('fetchFailedNotFoundTitle'),
      message: i18nLocalize('fetchFailedNotFoundMessage'),
    }
    return new NotFound(reason)
  }

  if (statusCode === 401) {
    // TODO: i18n
    const reason: FetchErrorReason = {
      status: statusCode,
      title: 'Unauthorized',
      message: 'Please check your login session or your permission to read this tweet.',
    }
    return new Unauthorized(reason)
  }

  const reason: FetchErrorReason = {
    status: statusCode,
    title: i18nLocalize('fetchFailedUnknownTitle') + statusCode,
    message: i18nLocalize('fetchFailedUnknownMessage'),
  }

  return new UnknownError(reason)
}

export const fetchMediaCatalog = async (tweetId: string): Promise<TweetMediaCatalog> => {
  const csrfToken = await twitterTokenRepo.getCsrfToken()
  const guestToken = await twitterTokenRepo.getGuestToken()
  const endpoint = makeTweetEndpoint(tweetId)
  const mediaResponse = await fetch(endpoint, {
    method: 'GET',
    headers: initHeaders(tweetId, csrfToken, guestToken),
    mode: 'cors',
    cache: 'no-cache',
  })

  if (mediaResponse.status === 200) {
    const detail: TweetDetail = await mediaResponse.json()
    const medias = getMediaFromDetailByTweetId(detail)(tweetId)
    const mediaCatalog: TweetMediaCatalog = {
      images: [],
      videos: [],
    }

    if (medias) {
      mediaCatalog.images = parseImage(medias)
      mediaCatalog.videos = parseVideo(medias)
    }

    return mediaCatalog
  }

  const err = getFetchError(mediaResponse.status)
  throw err
}

/**
 * Clean all searchParams
 */
const cleanUrl = (url: URL): URL => {
  url.searchParams.delete('tag')
  return url
}
const makeTweetEndpoint = (tweetId: string) =>
  `https://api.twitter.com/2/timeline/conversation/${tweetId}.json?tweet_mode=extended`

const getMediaFromDetailByTweetId =
  (detail: TweetDetail) =>
  (tweetId: string): TweetMedia[] | undefined =>
    detail?.globalObjects?.tweets[tweetId]?.extended_entities?.media

const getVideoInfo = (tweetMedia: TweetMedia): VideoInfo | null => tweetMedia?.video_info

const parseImage = (medias: TweetMedia[]): string[] =>
  medias.map(media => cleanUrl(new URL(media.media_url_https)).href)

const parseVideo = (medias: TweetMedia[]): string[] => {
  const mediaList: string[] = []
  medias.forEach(media => {
    const videoInfo = getVideoInfo(media)
    if (videoInfo) {
      mediaList.push(parseVideoInfo(videoInfo))
    }
  })
  return mediaList
}

const parseVideoInfo = (video_info: VideoInfo): string => {
  const { variants } = video_info

  let hiRes = 0
  let targetUrl: URL

  variants.forEach(variant => {
    const { bitrate, url } = variant
    // bitrate will be 0 if video is made from gif.
    // variants contains m3u8 info.
    const isHigherBitrate = bitrate > hiRes || bitrate === 0
    if (bitrate !== undefined && isHigherBitrate) {
      hiRes = bitrate
      targetUrl = cleanUrl(new URL(url))
    }
  })

  return targetUrl.href
}

const initHeaders = (tweetId: string, csrfToken: string, guestToken?: string) =>
  new Headers([
    ['Authorization', TWITTER_AUTH_TOKEN],
    ['User-Agent', navigator.userAgent],
    ['Referer', `https://twitter.com/i/web/status/${tweetId}`],
    ['cache-control', 'no-cache'],
    ['x-twitter-active-user', 'yes'],
    ['x-csrf-token', csrfToken],
    guestToken ? ['x-guest-token', guestToken] : ['x-twitter-auth-type', 'OAuth2Session'],
  ])
