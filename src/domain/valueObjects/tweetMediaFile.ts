import { ValueObject } from './base'
import type { TweetUser } from './tweetUser'

type TweetMediaFileProps = {
  _type: 'image' | 'thumbnail' | 'video'
  tweetUser: TweetUser
  tweetId: string
  source: string
  createdAt: Date
  /**
   * Start from 1.
   */
  serial: number
  hash: string
  ext: string
}

export class TweetMediaFile extends ValueObject<TweetMediaFileProps> {
  get isVideo(): boolean {
    return this.props._type === 'video'
  }
}
