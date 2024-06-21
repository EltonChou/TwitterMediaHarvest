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
  readonly id: number
  readonly tweetInfo: TweetInfo
  readonly config: Downloads.DownloadOptionsType

  constructor(params: BrowserDownloadDispatchedInitParams) {
    super('download:status:dispatched:browser')
    this.id = params.id
    this.tweetInfo = params.tweetInfo
    this.config = params.config
  }
}
