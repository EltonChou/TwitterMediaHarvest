/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import { DomainEvent } from './base'

export default abstract class TweetFetchErrorNotificationInteracted
  extends DomainEvent
  implements TweetFetchingFailedNotificationEvent
{
  readonly tweetId: string

  constructor(name: DomainEvent['name'], tweetId: string) {
    super(name)
    this.tweetId = tweetId
  }
}
