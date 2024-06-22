import { DomainEvent } from './base'
import type { Downloads } from 'webextension-polyfill'

type BrowserDownloadDispatchedInitParams = {
  id: number
  tweetInfo: TweetInfo
  config: Downloads.DownloadOptionsType
}

export default class BrowserDownloadDispatched
  extends DomainEvent
  implements BrowserDownloadDispatchEvent
{
  readonly downloadId: number
  readonly tweetInfo: TweetInfo
  readonly downloadConfig: Downloads.DownloadOptionsType

  constructor(params: BrowserDownloadDispatchedInitParams) {
    super('download:status:dispatched:browser')
    this.downloadId = params.id
    this.tweetInfo = params.tweetInfo
    this.downloadConfig = params.config
  }
}
