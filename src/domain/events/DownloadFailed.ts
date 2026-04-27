// SPDX-License-Identifier: MPL-2.0
import type { DownloadConfig } from '#domain/valueObjects/downloadConfig'
import type { TweetInfo } from '#domain/valueObjects/tweetInfo'
import DownloadBaseEvent from './Download'

type DownloadFailedInitParams = {
  downloadId: number
  reason: Error | string
  tweetInfo: TweetInfo
  downloadConfig: DownloadConfig
}

export default class DownloadFailed
  extends DownloadBaseEvent
  implements DownloadFailedEvent
{
  readonly reason: Error | string
  readonly tweetInfo: TweetInfo
  readonly downloadConfig: DownloadConfig

  constructor(params: DownloadFailedInitParams) {
    super('download:status:failed', params.downloadId)
    this.reason = params.reason
    this.tweetInfo = params.tweetInfo
    this.downloadConfig = params.downloadConfig
  }
}
