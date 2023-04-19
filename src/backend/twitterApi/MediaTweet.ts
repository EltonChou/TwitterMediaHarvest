import { TwitterTokenRepository } from '../cookie/repository'
import { NotFound, TooManyRequest, TwitterApiError, Unauthorized, UnknownError } from '../errors'
import { i18nLocalize } from '../utils/i18n'

const TWITTER_AUTH_TOKEN =
  'Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA'

const twitterTokenRepo = new TwitterTokenRepository()

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
    const reason: FetchErrorReason = {
      status: statusCode,
      title: i18nLocalize('backend_notification_title_unauth'),
      message: i18nLocalize('backend_notification_message_unauth'),
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
  })

  if (mediaResponse.status === 200) {
    const tweet: Tweet = await mediaResponse.json()
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

  const err = getFetchError(mediaResponse.status)
  throw err
}

/**
 * Clean all searchParams
 */
const cleanUrl = (url: string): string => {
  const cleanedUrl = new URL(url)
  cleanedUrl.searchParams.delete('tag')
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

const initHeaders = (tweetId: string, csrfToken: string, guestToken?: string) =>
  new Headers([
    ['Authorization', TWITTER_AUTH_TOKEN],
    ['User-Agent', navigator.userAgent],
    ['Referer', `https://twitter.com/i/web/status/${tweetId}`],
    ['x-twitter-active-user', 'yes'],
    ['x-csrf-token', csrfToken],
    guestToken ? ['x-guest-token', guestToken] : ['x-twitter-auth-type', 'OAuth2Session'],
  ])
