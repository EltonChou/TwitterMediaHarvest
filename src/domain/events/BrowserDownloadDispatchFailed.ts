/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import type { TweetInfo } from '#domain/valueObjects/tweetInfo'
import { DomainEvent } from './base'

type BrowserDownloadDispatchFailedInitParams = {
  reason: Error | string
  tweetInfo: TweetInfo
}

export default class BrowserDownloadDispatchFailed
  extends DomainEvent
  implements BrowserDownloadDispatchFailedEvent
{
  readonly reason: Error | string
  readonly tweetInfo: TweetInfo

  constructor(params: BrowserDownloadDispatchFailedInitParams) {
    super('download:status:dispatch-failed:browser')
    this.reason = params.reason
    this.tweetInfo = params.tweetInfo
  }
}
