import path from 'path'
import {
  makeAria2DownloadConfig,
  makeBrowserDownloadConfig,
} from '../utils/maker'
import {
  Aria2DownloadOption,
  DownloadMode,
  FilenameSetting,
  TweetInfo,
} from '../typings'

export default class TwitterMediaFile {
  public screenName: string
  public tweetId: string
  public url: string
  public src: string
  public ext: string
  public name: string
  public order: string

  constructor(tweetInfo: TweetInfo, url: string, index = 0) {
    this.screenName = tweetInfo.screenName
    this.tweetId = tweetInfo.tweetId
    this.url = cleanUrl(url)
    this.src = makeOrigSrc(this.url)
    this.ext = path.extname(this.url)
    this.name = path.basename(this.url, this.ext)
    this.order = String(index + 1)
  }

  makeFileNameBySetting(setting: FilenameSetting) {
    const root = setting.no_subdirectory ? '' : setting.directory.concat('/')

    const accountPart = setting.filename_pattern.account
      ? `${this.screenName}-`
      : ''

    let serialPart
    switch (setting.filename_pattern.serial) {
      case 'order':
        serialPart = this.order.padStart(2, '0')
        break

      case 'file_name':
        serialPart = this.name
        break

      default:
        serialPart = this.order.padStart(2, '0')
    }

    const basename = accountPart.concat(this.tweetId, '-', serialPart)
    const fullPath = root.concat(basename, this.ext)

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

/**
 * Clean all searchParams
 */
function cleanUrl(url: string): string {
  const theUrl = new URL(url)
  theUrl.searchParams.delete('tag')

  return theUrl.href
}

function selectConfigMakerByMode(modeName: DownloadMode) {
  if (modeName === DownloadMode.Aria2) return makeAria2DownloadConfig
  if (modeName === DownloadMode.Browser) return makeBrowserDownloadConfig
}

export { TwitterMediaFile, makeOrigSrc }
