/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import type { TweetInfo } from '#domain/valueObjects/tweetInfo'
import { DomainEvent } from './base'

export default class TweetParsingFailed
  extends DomainEvent
  implements TweetInfoEvent
{
  readonly tweetInfo: TweetInfo

  constructor(tweetInfo: TweetInfo) {
    super('parse:tweet:failed')
    this.tweetInfo = tweetInfo
  }
}
