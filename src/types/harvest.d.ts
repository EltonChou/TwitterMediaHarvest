declare module '*.svg' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const content: any
  export default content
}

type TweetMode = 'photo' | 'status' | 'stream'

type HarvestMessage<T> = {
  action: number
  data?: T
}

type ResponseStatus = 'success' | 'error'

type HarvestResponse<T> = {
  status: ResponseStatus
  data?: T
}

type TweetInfo = {
  screenName: string
  tweetId: string
}

type TweetMediaCatalog = {
  images: string[]
  videos: string[]
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

type ButtonStatus = 'downloading' | 'success' | 'error'

type ClientTokenResponse = {
  token: string
  uninstallCode: string
}

type Provider<T> = (() => T) | (() => Promise<T>)

interface IProcessLock {
  isLocked(): Promise<boolean>
  acquire(): Promise<void>
  release(): Promise<void>
}

type Aria2DownloadOption = {
  url: string
  filename: string
  referrer: string
  options?: object
}

interface TweetDetail {
  id: string
  userId: string
  displayName: string
  screenName: string
  createdAt: Date
}

type TweetMediaFileProps = {
  url: string
  order: number
}

interface ITweetMediaFileDetail {
  src: string
  ext: string
  hashName: string
  order: number
}

type Entries<T> = {
  [K in keyof T]: [K, T[K]]
}[keyof T][]
