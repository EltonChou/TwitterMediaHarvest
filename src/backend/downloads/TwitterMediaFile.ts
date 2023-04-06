import V4FilenameSettingsUsecase from '@backend/settings/filenameSettings/usecase'
import path from 'path'
import type { Downloads } from 'webextension-polyfill'

export const enum DownloadMode {
  Aria2 = 'aria2',
  Browser = 'browser',
}

export default class TwitterMediaFile {
  readonly screenName: string
  readonly tweetId: string
  readonly src: string
  readonly ext: string
  readonly name: string
  readonly order: number

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

  makeDownloadConfigBySetting(setting: V4FilenameSettings, mode: DownloadMode.Aria2): Aria2DownloadOption

  makeDownloadConfigBySetting(setting: V4FilenameSettings, mode: DownloadMode.Browser): Downloads.DownloadOptionsType

  makeDownloadConfigBySetting(
    setting: V4FilenameSettings,
    mode: DownloadMode
  ): Downloads.DownloadOptionsType | Aria2DownloadOption
  /**
   * Create download config
   */
  makeDownloadConfigBySetting(
    setting: V4FilenameSettings,
    mode: DownloadMode
  ): Downloads.DownloadOptionsType | Aria2DownloadOption {
    const filenameSettingsUseCase = new V4FilenameSettingsUsecase(setting)
    const url = this.src
    const filename = filenameSettingsUseCase.makeFilename({
      account: this.screenName,
      tweetId: this.tweetId,
      serial: this.order,
      hash: this.name,
      date: new Date(),
    })
    const fileFullPath = filenameSettingsUseCase.makeFullPathWithFilenameAndExt(filename, this.ext)
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

/** Make original quality source of tweet media from media url */
export const makeImageOrigSrc = (url: string): string => `${url}:orig`

export const selectConfigMakerByMode = (modeName: DownloadMode) => {
  if (modeName === DownloadMode.Aria2) return makeAria2DownloadConfig
  if (modeName === DownloadMode.Browser) return makeBrowserDownloadConfig
}

/**
 * Create browser download config object.
 *
 * @param url
 * @param fileName
 */
export const makeBrowserDownloadConfig = (url: string, fileName: string): Downloads.DownloadOptionsType => {
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
