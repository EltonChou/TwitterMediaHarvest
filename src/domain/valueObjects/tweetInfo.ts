import { ValueObject } from './base'

type TweetInfoProps = {
  screenName: string
  tweetId: string
}

export class TweetInfo extends ValueObject<TweetInfoProps> {
  get screenName() {
    return this.props.screenName
  }

  get tweetId() {
    return this.props.tweetId
  }
}
