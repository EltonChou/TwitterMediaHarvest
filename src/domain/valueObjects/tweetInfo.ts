import { ValueObject } from './base'

type TweetInfoProps = {
  screenName: string
  tweetId: string
}

export class TweetInfo extends ValueObject<TweetInfoProps> {}
