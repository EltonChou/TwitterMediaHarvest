type TweetMode = 'photo' | 'status' | 'stream'
type DownloadRecordId = `dl_${number}`
type DownloadItemRecorder = (
  config: chrome.downloads.DownloadOptions
) => (downloadId: number) => void

interface HarvestMessage {
  action: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any
}

interface TweetInfo {
  screenName: string
  tweetId: string
}

interface FilenamePatternOption {
  account: boolean
  serial: 'order' | 'filename'
}

interface FilenameSetting {
  directory: string
  no_subdirectory: boolean
  filename_pattern: FilenamePatternOption
}


interface Aria2DownloadOption {
  url: string
  filename: string
  referrer: string
  options?: object
}

interface LocalStorageInitialData {
  successDownloadCount: number
  failedDownloadCount: number
  errorCount: number
  enableAria2: boolean
}

interface DownloadRecord {
  info: TweetInfo
  config: chrome.downloads.DownloadOptions
}

interface FetchErrorReason {
  status: number
  title: string
  message: string
}

interface HarvestObserver {
  observeRoot: () => void
}
