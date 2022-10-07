import path from 'path'

export const enum FilenameSerialRule {
  Order = 'order',
  Filename = 'filename'
}

export const enum DownloadMode {
  Aria2 = 'aria2',
  Browser = 'browser',
}

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
    this.ext = path.extname(url)
    this.src = this.isVideo() ? url : makeImageOrigSrc(url)
    this.name = path.basename(url, this.ext)
    this.order = index + 1
  }

  isVideo(): boolean {
    return this.ext === '.mp4'
  }

  makeFilenameBySetting(setting: FilenameSetting) {
    const accountPart = setting.filename_pattern.account
      ? this.screenName.concat('-')
      : ''

    let serialPart: string
    if (setting.filename_pattern.serial === FilenameSerialRule.Order) serialPart = makeSerialOrder(this.order)
    if (setting.filename_pattern.serial === FilenameSerialRule.Filename) serialPart = this.name

    return accountPart.concat(this.tweetId, '-', serialPart)
  }

  makeFileFullPathBySetting(setting: FilenameSetting) {
    const directory = makeDirectoryBySetting(setting)
    const fileName = this.makeFilenameBySetting(setting)
    return path.format({
      dir: directory,
      name: fileName,
      ext: this.ext
    })
  }

  /**
   * Create download config
   */
  makeDownloadConfigBySetting(
    setting: FilenameSetting,
    mode: DownloadMode
  ): chrome.downloads.DownloadOptions | Aria2DownloadOption {
    const url = this.src
    const fileFullPath = this.makeFileFullPathBySetting(setting)
    const tweetReferer = `https://twitter.com/i/web/status/${this.tweetId}`
    const makeConfig = selectConfigMakerByMode(mode)
    const config = makeConfig(url, fileFullPath, tweetReferer)

    return config
  }

  static isValidFileUrl(url: string): boolean {
    const twitter_media_url_pattern =
      /^https:\/\/(?:pbs|video)\.twimg\.com\/(?:media|.*_video.*)\/.*\.(?:jpg|png|gif|mp4)$/
    return Boolean(url.match(twitter_media_url_pattern))
  }
}


export const makeDirectoryBySetting = (setting: FilenameSetting) =>
  setting.no_subdirectory ? '' : setting.directory

/** Make original quality source of tweet media from media url */
export const makeImageOrigSrc = (url: string): string => `${url}:orig`

export const selectConfigMakerByMode = (modeName: DownloadMode) => {
  if (modeName === DownloadMode.Aria2) return makeAria2DownloadConfig
  if (modeName === DownloadMode.Browser) return makeBrowserDownloadConfig
}

export const makeSerialOrder = (order: number): string => String(order).padStart(2, '0')

/**
 * Create browser download config object.
 *
 * @param url
 * @param fileName
 */
export const makeBrowserDownloadConfig = (
  url: string,
  fileName: string
): chrome.downloads.DownloadOptions => {
  return {
    url: url,
    filename: fileName,
    conflictAction: 'overwrite',
    saveAs: false,
  }
}

/**
 * Create aria2 download config object.
 *
 * @param url
 * @param fileName
 * @param referrer
 * @param options aria2 options
 */
export const makeAria2DownloadConfig = (
  url: string,
  fileName: string,
  referrer: string,
  options: object = {}
): Aria2DownloadOption => {
  return {
    url: url,
    filename: fileName,
    referrer: referrer,
    options: options,
  }
}
