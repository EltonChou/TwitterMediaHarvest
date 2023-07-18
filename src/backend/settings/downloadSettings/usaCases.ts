import { DownloadSettings } from '@schema'
import type { Downloads } from 'webextension-polyfill'
import Browser from 'webextension-polyfill'

export class DownloadSettingsUseCase {
  constructor(readonly settings: DownloadSettings) {}

  makeDownloadConfig(url: string, filePath: string) {
    return this.settings.enableAria2
      ? makeAria2DownloadConfig(url, filePath, Browser.runtime.getURL(''))
      : makeBrowserDownloadConfig(url, filePath, this.settings.askWhereToSave)
  }
}

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
