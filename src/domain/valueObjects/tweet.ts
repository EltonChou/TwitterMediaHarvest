/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import MediaType from '#enums/mediaType'
import { ValueObject } from './base'
import type { TweetMedia } from './tweetMedia'
import type { TweetUser } from './tweetUser'

export type TweetProps = {
  id: string
  createdAt: Date
  hashtags: string[]

  user: TweetUser
  images: TweetMedia[]
  videos: TweetMedia[]
}

export class Tweet extends ValueObject<TweetProps> {
  get id() {
    return this.props.id
  }

  /**
   * Indicate the tweet is private or not.
   */
  get isPrivate(): boolean {
    return this.user.isProtected
  }

  get user(): TweetUser {
    return this.props.user
  }

  get medias(): TweetMedia[] {
    return [...this.props.images, ...this.props.videos]
  }

  get images(): TweetMedia[] {
    return this.props.images
  }

  get videos(): TweetMedia[] {
    return this.props.videos
  }

  get mediaType(): MediaType {
    if (this.videos.length === 0) return MediaType.Image
    if (this.videos.length > 0 && this.videos.length === this.images.length)
      return MediaType.Video
    return MediaType.Mixed
  }

  static create(props: TweetProps) {
    return new Tweet(props)
  }
}
