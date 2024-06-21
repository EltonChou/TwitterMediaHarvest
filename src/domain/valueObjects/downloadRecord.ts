import { ValueObject } from './base'
import type { Downloads } from 'webextension-polyfill'

type DownloadRecordProps = {
  downloadId: Downloads.DownloadItem['id']
  tweetInfo: TweetInfo
  downloadConfig: Downloads.DownloadOptionsType
  recordedAt: Date
}

export class DownloadRecord extends ValueObject<DownloadRecordProps> {}
