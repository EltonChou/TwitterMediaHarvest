import MediaType from '#enums/mediaType'
import type { DBSchema } from 'idb'
import type { Downloads } from 'webextension-polyfill'

export type DownloadDBVersion = 1 | 2 | 3

export interface DownloadDBSchema extends DBSchema {
  record: {
    key: number
    value: DownloadRecordItem
  }
  history: {
    key: string
    value: DownloadHistoryItem
    indexes: {
      byUserName: string[]
      byTweetTime: Date
      byDownloadTime: Date
    }
  }
  hashtag: {
    key: string
    value: HashtagItem
  }
}

export type DownloadHistoryItem = {
  tweetId: string
  userId: string
  displayName: string
  screenName: string
  tweetTime: Date
  downloadTime: Date
  mediaType: MediaType
  thumbnail?: string
  hashtags: Set<string>
}

export type HashtagItem = {
  name: string
  tweetIds: Set<string>
}

export type DownloadRecordItem = {
  id: number
  tweetInfo: TweetInfo
  config: Downloads.DownloadOptionsType
}
