import { TWITTER_AUTH_TOKEN } from '../constants'
import { i18nLocalize } from './chromeApi'

/**
 * @typedef {Object} fetchErrorReason
 * @property {number} status status code
 * @property {string} title
 * @property {string} message
 */

export default class MediaTweet {
  constructor(tweetId, token) {
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
    /**
     * @type fetchErrorReason
     */
    const reason = {
      status: statusCode,
      title: i18nLocalize('fetchFailedUnknownTitle') + statusCode,
      message: i18nLocalize('fetchFailedUnknownMessage'),
    }

    if (statusCode === 200) {
      const detail = await mediaResponse.json()
      mediaList = this.parseMedias(detail)
    }
    if (statusCode === 429) {
      reason.title = i18nLocalize('fetchFailedTooManyRequestsTitle')
      reason.message = i18nLocalize('fetchFailedTooManyRequestsMessage')

      errorReason = reason
    }

    return { mediaList: mediaList, errorReason: errorReason }
  }

  /**
   * @param {JSON} detail
   * @returns {string[]}
   */
  parseMedias(detail) {
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

  /**
   * @param {JSON} video_info
   * @returns {string[]}
   */
  parseVideo(video_info) {
    const mediaList = []
    const { variants } = video_info

    let hiRes = 0
    let targetUrl

    for (let variant of variants) {
      let { bitrate, url } = variant
      // bitrate will be 0 if video is made from gif.
      // variants contains m3u8 info.
      let isHigherBitrate = bitrate > hiRes || bitrate === 0
      if (typeof bitrate !== 'undefined' && isHigherBitrate) {
        hiRes = bitrate
        targetUrl = url
      }
    }

    mediaList.push(targetUrl)
    return mediaList
  }

  /**
   * @param {string[]} medias
   * @returns {string[]}
   */
  parseImage(medias) {
    return medias.map(media => media.media_url_https)
  }
}

/**
 * @param {string} token
 * @param {string} tweetId
 */
function initHeader(token, tweetId) {
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
