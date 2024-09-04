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
}
