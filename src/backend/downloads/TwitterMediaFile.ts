import V4FilenameSettingsUsecase from '@backend/settings/filenameSettings/usecase'
import type { V4FilenameSettings } from '@schema'
import path from 'path'
import type { Downloads } from 'webextension-polyfill'

export const enum DownloadMode {
  Aria2 = 'aria2',
  Browser = 'browser',
}

export default class TwitterMediaFile {
  readonly tweetDetail: TweetDetail
  readonly src: string
  readonly ext: string
  readonly name: string
  readonly order: number
  readonly askPath: boolean

  constructor(tweetDetail: TweetDetail, url: string, index = 0, askPath: boolean) {
    this.tweetDetail = tweetDetail
    this.ext = path.extname(url)
    this.src = this.isVideo() ? url : makeImageOrigSrc(url)
    this.name = path.basename(url, this.ext)
    this.order = index + 1
    this.askPath = askPath
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
    const filename = filenameSettingsUseCase.makeFilename(this.tweetDetail, {
      serial: this.order,
      hash: this.name,
      date: new Date(),
    })
    const fileFullPath = filenameSettingsUseCase.makeFullPathWithFilenameAndExt(filename, this.ext)
    const tweetReferer = `https://twitter.com/i/web/status/${this.tweetDetail.id}`

    return mode === DownloadMode.Aria2
      ? makeAria2DownloadConfig(this.src, fileFullPath, tweetReferer)
      : makeBrowserDownloadConfig(this.src, fileFullPath, this.askPath)
  }

  static isValidFileUrl(url: string): boolean {
    const twitter_media_url_pattern =
      /^https:\/\/(?:pbs|video)\.twimg\.com\/(?:media|.*_video.*)\/.*\.(?:jpg|png|gif|mp4)$/
    return Boolean(url.match(twitter_media_url_pattern))
  }
}

/** Make original quality source of tweet media from media url */
export const makeImageOrigSrc = (url: string): string => `${url}:orig`

/**
 * Create browser download config object.
 *
 * @param url
 * @param fileName
 */
export const makeBrowserDownloadConfig = (
  url: string,
  fileName: string,
  askPath: boolean
): Downloads.DownloadOptionsType => {
  const options: Downloads.DownloadOptionsType = {
    url: url,
    filename: fileName,
    conflictAction: 'overwrite',
  }
  return process.env.TARGET === 'firefox' ? { ...options, saveAs: askPath } : options
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
