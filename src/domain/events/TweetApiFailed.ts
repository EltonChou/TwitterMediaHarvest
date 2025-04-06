/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import type { TweetInfo } from '#domain/valueObjects/tweetInfo'
import { DomainEvent } from './base'

export default class TweetApiFailed
  extends DomainEvent
  implements TweetApiErrorEvent
{
  readonly tweetInfo: TweetInfo
  readonly code: number

  constructor(tweetInfo: TweetInfo, code: number) {
    super('api:twitter:failed')
    this.tweetInfo = tweetInfo
    this.code = code
  }
}
