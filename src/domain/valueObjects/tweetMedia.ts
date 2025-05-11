/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { ValueObject } from './base'

export type TweetMediaProps = {
  type: 'photo' | 'thumbnail' | 'video'
  index: number
  url: string
}

export class TweetMedia extends ValueObject<TweetMediaProps> {
  get isVideo() {
    return this.props.type === 'video'
  }

  get isThumbnail() {
    return this.props.type === 'thumbnail'
  }

  getVariantUrl(variant: 'orig' | 'large' | 'medium' | 'small' | 'thumb') {
    if (this.isVideo) return this.props.url

    const url = new URL(this.props.url)
    url.pathname += ':' + variant
    return url.href
  }

  static create(props: TweetMediaProps) {
    return new TweetMedia(props)
  }
}
