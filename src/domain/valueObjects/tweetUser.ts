/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { ValueObject } from './base'

export type TweetUserProps = {
  userId: string
  displayName: string
  screenName: string
  isProtected: boolean
}

export class TweetUser extends ValueObject<TweetUserProps> {
  /**
   * Indicate the user's timeline is private or not.
   */
  get isProtected() {
    return this.props.isProtected
  }

  static create(props: TweetUserProps) {
    return new TweetUser(props)
  }
}
