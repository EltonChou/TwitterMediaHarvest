/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import type { DownloadConfig } from '#domain/valueObjects/downloadConfig'
import type { TweetInfo } from '#domain/valueObjects/tweetInfo'
import { DomainEvent } from './base'

type BrowserDownloadDispatchedInitParams = {
  id: number
  tweetInfo: TweetInfo
  config: DownloadConfig
}

export default class BrowserDownloadDispatched
  extends DomainEvent
  implements BrowserDownloadDispatchedEvent
{
  readonly downloadId: number
  readonly tweetInfo: TweetInfo
  readonly downloadConfig: DownloadConfig

  constructor(params: BrowserDownloadDispatchedInitParams) {
    super('download:status:dispatched:browser')
    this.downloadId = params.id
    this.tweetInfo = params.tweetInfo
    this.downloadConfig = params.config
  }
}
