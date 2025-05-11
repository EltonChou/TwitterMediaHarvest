/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { ValueObject } from './base'
import type { TweetUser } from './tweetUser'

type TweetMediaFileProps = {
  type: 'image' | 'thumbnail' | 'video'
  tweetUser: TweetUser
  tweetId: string
  source: string
  createdAt: Date
  /**
   * Start from 1.
   */
  serial: number
  hash: string
  /**
   * Start with '.'
   * @example `.jpg`, `.png`, `.mp4`
   */
  ext: string
}

export class TweetMediaFile extends ValueObject<TweetMediaFileProps> {
  get isVideo(): boolean {
    return this.props.type === 'video'
  }

  get isThumbnail(): boolean {
    return this.props.type === 'thumbnail'
  }

  static create(props: TweetMediaFileProps) {
    return new TweetMediaFile(props)
  }
}
