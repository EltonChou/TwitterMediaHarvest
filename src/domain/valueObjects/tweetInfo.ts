/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { ValueObject } from './base'

type TweetInfoProps = {
  screenName: string
  tweetId: string
}

export class TweetInfo extends ValueObject<TweetInfoProps> {
  get screenName() {
    return this.props.screenName
  }

  get tweetId() {
    return this.props.tweetId
  }
}
