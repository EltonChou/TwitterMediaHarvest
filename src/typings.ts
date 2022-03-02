/* eslint-disable @typescript-eslint/no-explicit-any */
export interface HarvestObserver {
  observeRoot: () => void
}

export abstract class TwitterMediaHarvestObserver implements HarvestObserver {
  public abstract observeRoot(): void
}

export type TweetInfo = {
  screenName: string
  tweetId: string
}

export type FilenamePatternOption = {
  account: boolean
  serial: 'order' | 'file_name'
}

export type FilenameSetting = {
  directory: string
  no_subdirectory: boolean
  filename_pattern: FilenamePatternOption
}

export const enum DownloadMode {
  Aria2 = 'aria2',
  Browser = 'browser',
}

export type Aria2DownloadOption = {
  url: string
  filename: string
  referrer: string
  options?: object
}

export type TweetMode = 'photo' | 'status' | 'stream'

export const enum StatisticsKey {
  SuccessDownloadCount = 'successDownloadCount',
  FailedDownloadCount = 'failedDownloadCount',
  ErrorCount = 'errorCount',
}

export type LocalStorageInitialData = {
  [StatisticsKey.SuccessDownloadCount]: number
  [StatisticsKey.FailedDownloadCount]: number
  [StatisticsKey.ErrorCount]: number
  enableAria2: boolean
}

export type DownloadRecord = {
  info: TweetInfo
  config: chrome.downloads.DownloadOptions
}

export type DownloadRecordId = `dl_${number}`

export type FetchErrorReason = {
  status: number
  title: string
  message: string
}

export type DownloadItemRecorder = (
  config: chrome.downloads.DownloadOptions
) => (downloadId: number) => void

export const enum Action {
  Download,
  Refresh
}

export type HarvestMessage = {
  action: Action
  data?: any
}
