import { ValueObject } from './base'
import type { DownloadConfig } from './downloadConfig'
import type { TweetInfo } from './tweetInfo'

type DownloadRecordProps = {
  downloadId: number
  tweetInfo: TweetInfo
  downloadConfig: DownloadConfig
  recordedAt: Date
}

export class DownloadRecord extends ValueObject<DownloadRecordProps> {}
