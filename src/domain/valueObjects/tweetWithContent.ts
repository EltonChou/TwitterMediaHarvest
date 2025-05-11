/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { ValueObject } from './base'
import { Tweet } from './tweet'

export type TweetWithContentProps = {
  tweet: Tweet
  content: string
}

export class TweetWithContent extends ValueObject<TweetWithContentProps> {
  get id() {
    return this.tweet.id
  }

  get tweet() {
    return this.props.tweet
  }

  get content() {
    return this.props.content
  }

  static create(props: TweetWithContentProps) {
    return new TweetWithContent(props)
  }
}
