import { ValueObject } from './base'

export type TweetMediaProps = {
  type: 'image' | 'thumbnail' | 'video'
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
}
