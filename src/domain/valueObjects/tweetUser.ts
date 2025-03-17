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
}
