import Entity from '../entity'

interface DownloadRecordProps {
  tweetInfo: TweetInfo
  downloadConfig: chrome.downloads.DownloadOptions
}

type DownloadRecordValueObject = {
  'id': number,
  'tweetInfo': TweetInfo,
  'config': chrome.downloads.DownloadOptions
}


export default class DownloadRecord extends Entity<number, DownloadRecordProps> {
  constructor(downloadItemId: number, props: DownloadRecordProps) {
    super(downloadItemId, props)
  }

  public get tweetInfo(): TweetInfo {
    return this.props.tweetInfo
  }

  public get downloadConfig(): chrome.downloads.DownloadOptions {
    return this.props.downloadConfig
  }

  toJson(): DownloadRecordValueObject {
    return {
      id: this.id,
      tweetInfo: this.props.tweetInfo,
      config: this.props.downloadConfig
    }
  }

  static fromJson(valueObject: DownloadRecordValueObject): DownloadRecord {
    const props: DownloadRecordProps = {
      tweetInfo: valueObject.tweetInfo,
      downloadConfig: valueObject.config
    }
    return new DownloadRecord(valueObject.id, props)
  }
}