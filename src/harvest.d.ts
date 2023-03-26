type TweetMode = 'photo' | 'status' | 'stream'
type DownloadRecordId = `dl_${number}`

type HarvestMessage = {
  action: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any
}

type TweetInfo = {
  screenName: string
  tweetId: string
}

type FilenamePatternOption = {
  account: boolean
  serial: 'order' | 'filename'
}

type FilenameSettings = {
  directory: string
  no_subdirectory: boolean
  filename_pattern: FilenamePatternOption
}

type DownloadSettings = {
  enableAria2: boolean
  aggressive_mode: boolean
}

type FeatureSettings = {
  autoRevealNsfw: boolean
  includeVideoThumbnail: boolean
}

type Aria2DownloadOption = {
  url: string
  filename: string
  referrer: string
  options?: object
}

type TweetMediaCatalog = {
  images: string[]
  videos: string[]
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
  initialize: () => void
}

type SyncStorageSchema = FilenameSettings
type LocalStorageSchema = FeatureSettings & DownloadSettings
