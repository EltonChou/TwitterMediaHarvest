import type { DownloadConfig } from '#domain/valueObjects/downloadConfig'
import type { TweetInfo } from '#domain/valueObjects/tweetInfo'
import { DomainEvent } from './base'

type BrowserDownloadFailedInitParams = {
  reason: Error | string
  tweetInfo: TweetInfo
  config: DownloadConfig
}

export default class BrowserDownloadIsFailed
  extends DomainEvent
  implements BrowserDownloadFailedEvent
{
  readonly reason: Error | string
  readonly tweetInfo: TweetInfo
  readonly downloadConfig: DownloadConfig

  constructor(params: BrowserDownloadFailedInitParams) {
    super('download:status:failed:browser')
    this.reason = params.reason
    this.tweetInfo = params.tweetInfo
    this.downloadConfig = params.config
  }
}
