import type { Downloads } from 'webextension-polyfill'
import Entity from '../entity'

interface DownloadRecordProps {
  tweetInfo: TweetInfo
  downloadConfig: Downloads.DownloadOptionsType
}

type DownloadRecordValueObject = {
  id: number
  tweetInfo: TweetInfo
  config: Downloads.DownloadOptionsType
}

export default class DownloadRecord extends Entity<number, DownloadRecordProps> {
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
