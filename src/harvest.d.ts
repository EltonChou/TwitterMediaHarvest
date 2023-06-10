type TweetMode = 'photo' | 'status' | 'stream'
type DownloadRecordId = `dl_${number}`

type HarvestMessage = {
  action: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any
}

type ResponseStatus = 'success' | 'error'

type HarvestResponse = {
  status: ResponseStatus
  data?: unknown
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

type FilenamePatternToken = '{account}' | '{tweetId}' | '{serial}' | '{hash}' | '{date}'

type V4FilenamePattern = FilenamePatternToken[]

type V4FilenameSettings = {
  directory: string
  noSubDirectory: boolean
  filenamePattern: V4FilenamePattern
}

type DownloadSettings = {
  enableAria2: boolean
  aggressiveMode: boolean
  askWhereToSave: boolean
}

type FeatureSettings = {
  autoRevealNsfw: boolean
  includeVideoThumbnail: boolean
  keyboardShortcut: boolean
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

interface IHarvestObserver {
  observeRoot: () => void
  initialize: () => void
}

interface IHarvester {
  appendButton: () => void
}

type SyncStorageSchema = FilenameSettings
type LocalStorageSchema = FeatureSettings & DownloadSettings

type V4Statistics = {
  downloadCount: number
  trafficUsage: number
}

type TwitterApiVersion = 'v1' | 'v2' | 'gql'

type TwitterApiSettings = {
  twitterApiVersion: TwitterApiVersion
}

type ButtonStatus = 'downloading' | 'success' | 'error'

type ClientTokenResponse = {
  token: string
}

type ClientInfo = {
  uuid: string
  csrfToken: string
  syncedAt: number
}

type Provider<T> = (() => T) | (() => Promise<T>)

interface IProcessLock {
  isLocked(): Promise<boolean>
  acquire(): Promise<void>
  release(): Promise<void>
}
