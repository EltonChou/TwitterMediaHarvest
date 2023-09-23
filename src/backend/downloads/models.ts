import Entity from '../entity'
import type { DownloadHistoryItem } from '@schema'
import type { Downloads } from 'webextension-polyfill'

interface DownloadRecordProps {
  tweetInfo: TweetInfo
  downloadConfig: Downloads.DownloadOptionsType
}

type DownloadRecordValueObject = {
  id: number
  tweetInfo: TweetInfo
  config: Downloads.DownloadOptionsType
}

export class DownloadRecord extends Entity<number, DownloadRecordProps> {
  constructor(downloadItemId: number, props: DownloadRecordProps) {
    super(downloadItemId, props)
  }

  public get tweetInfo(): TweetInfo {
    return this.props.tweetInfo
  }

  public get downloadConfig(): Downloads.DownloadOptionsType {
    return this.props.downloadConfig
  }

  toJson(): DownloadRecordValueObject {
    return {
      id: this.id,
      tweetInfo: this.props.tweetInfo,
      config: this.props.downloadConfig,
    }
  }

  static fromJson(valueObject: DownloadRecordValueObject): DownloadRecord {
    const props: DownloadRecordProps = {
      tweetInfo: valueObject.tweetInfo,
      downloadConfig: valueObject.config,
    }
    return new DownloadRecord(valueObject.id, props)
  }
}

export class DownloadHistoryEntity extends Entity<
  string,
  Omit<DownloadHistoryItem, 'tweetId'>
> {
  constructor(item: DownloadHistoryItem) {
    const { tweetId, ...props } = item
    super(tweetId, props)
  }

  static build(item: DownloadHistoryItem) {
    return new DownloadHistoryEntity(item)
  }

  toDownloadHistoryItem(): DownloadHistoryItem {
    return {
      tweetId: this.id,
      ...this.props,
    }
  }
}
