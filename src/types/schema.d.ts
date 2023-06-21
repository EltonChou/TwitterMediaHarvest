import type { DBSchema } from 'idb'
import type { Downloads } from 'webextension-polyfill'

interface DownloadDBSchema extends DBSchema {
  record: {
    key: number
    value: {
      id: number
      tweetInfo: TweetInfo
      config: Downloads.DownloadOptionsType
    }
  }
}
