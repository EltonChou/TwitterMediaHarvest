import path from 'path'
import {
  makeAria2DownloadConfig,
  makeBrowserDownloadConfig,
} from '../utils/maker'
import {
  Aria2DownloadOption,
  DownloadMode,
  FilenameSerialRule,
  FilenameSetting,
  TweetInfo,
} from '../typings'

export default class TwitterMediaFile {
  public screenName: string
  public tweetId: string
  public src: string
  public ext: string
  public name: string
  public order: number

  constructor(tweetInfo: TweetInfo, url: string, index = 0) {
    this.screenName = tweetInfo.screenName
    this.tweetId = tweetInfo.tweetId
    this.src = makeOrigSrc(url)
    this.ext = path.extname(url)
    this.name = path.basename(url, this.ext)
    this.order = index + 1
  }

  makeFileNameBySetting(setting: FilenameSetting) {
    const root = setting.no_subdirectory ? '' : setting.directory.concat('/')

    const accountPart = setting.filename_pattern.account
      ? `${this.screenName}-`
      : ''

    let serialPart
    switch (setting.filename_pattern.serial) {
      case FilenameSerialRule.Order:
        serialPart = makeSerialOrder(this.order)
        break

      case FilenameSerialRule.Filename:
        serialPart = this.name
        break

      default:
        serialPart = makeSerialOrder(this.order)
    }

    const filename = accountPart.concat(this.tweetId, '-', serialPart, this.ext)
    const fullPath = root.concat(filename)

    return fullPath
  }

  /**
   * Create download config
   */
  makeDownloadConfigBySetting(
    setting: FilenameSetting,
    mode: DownloadMode = DownloadMode.Browser
  ): chrome.downloads.DownloadOptions | Aria2DownloadOption {
    const url = this.src
    const fileName = this.makeFileNameBySetting(setting)
    const tweetReferer = `https://twitter.com/i/web/status/${this.tweetId}`
    const configMaker = selectConfigMakerByMode(mode)
    const config = configMaker(url, fileName, tweetReferer)

    return config
  }

  static isValidFileUrl(url: string): boolean {
    const twitter_media_url_pattern = /^https:\/\/(pbs|video)\.twimg\.com\/(media|ext_tw_video|tweet_video)\/.*\.(jpg|png|gif|mp4)$/
    return Boolean(url.match(twitter_media_url_pattern))
  }
}

/**
 * Make original quality source of tweet media from media url
 */
function makeOrigSrc(url: string): string {
  if (path.extname(url) === '.mp4') return url

  // const ext = path.extname(url).split('.')[1]
  // baseUrl.searchParams.append('format', ext)
  // baseUrl.searchParams.append('name', 'orig')

  return `${url}:orig`
}

function selectConfigMakerByMode(modeName: DownloadMode) {
  if (modeName === DownloadMode.Aria2) return makeAria2DownloadConfig
  if (modeName === DownloadMode.Browser) return makeBrowserDownloadConfig
}

const makeSerialOrder = (order: number): string => String(order).padStart(2, '0')

export { TwitterMediaFile, makeOrigSrc }
