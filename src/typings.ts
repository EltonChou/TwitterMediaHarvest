export abstract class TwitterMediaHarvestObserver {
  public abstract observeRoot(): void
}

export interface TweetInfo {
  screenName: string
  tweetId: string
}

export interface FilenamePatternOption {
  account: boolean
  serial: 'order' | 'file_name'
}

export interface FilenameSetting {
  directory: string
  no_subdirectory: boolean
  filename_pattern: FilenamePatternOption
}

export enum DownloadMode {
  Aria2 = 'aria2',
  Browser = 'browser',
}

export interface Aria2DownloadOption {
  url: string
  filename: string
  referrer: string
  options?: object
}

export type TweetMode = 'photo' | 'status' | 'stream'

export enum StatisticsKey {
  SuccessDownloadCount = 'successDownloadCount',
  FailedDownloadCount = 'failedDownloadCount',
  ErrorCount = 'errorCount',
}

export const LOCAL_STORAGE_KEY_ARIA2 = 'enableAria2'

export interface LocalStorageInitialData {
  [StatisticsKey.SuccessDownloadCount]: number
  [StatisticsKey.FailedDownloadCount]: number
  [StatisticsKey.ErrorCount]: number
  [LOCAL_STORAGE_KEY_ARIA2]: boolean
}

export interface DownloadRecord {
  info: TweetInfo
  config: chrome.downloads.DownloadOptions
}

export type DownloadRecordId = `dl_${number}`

export interface FetchErrorReason {
  status: number
  title: string
  message: string
}

export type DownloadItemRecorder = (
  config: chrome.downloads.DownloadOptions
) => (downloadId: number) => void
