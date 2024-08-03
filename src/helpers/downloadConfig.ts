import { isFirefox } from './runtime'
import type { Downloads } from 'webextension-polyfill'

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
  return isFirefox() ? { ...options, saveAs: askPath } : options
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
