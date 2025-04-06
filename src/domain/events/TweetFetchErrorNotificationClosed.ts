/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import TweetFetchErrorNotificationInteracted from './TweetFetchErrorNotificationInteracted'

export default class TweetFetchErrorNotificationClosed extends TweetFetchErrorNotificationInteracted {
  constructor(tweetId: string) {
    super('notification:tweetFetchError:self:closed', tweetId)
  }
}
