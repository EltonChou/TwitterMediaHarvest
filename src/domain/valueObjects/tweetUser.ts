import { ValueObject } from './base'

export type TweetUserProps = {
  userId: string
  displayName: string
  screenName: string
}

export class TweetUser extends ValueObject<TweetUserProps> {}
