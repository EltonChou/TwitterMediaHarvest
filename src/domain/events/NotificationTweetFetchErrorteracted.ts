import { DomainEvent } from './base'

export default abstract class TweetFetchErrorNotificationInteracted extends DomainEvent {
  readonly tweetInfo: TweetInfo

  constructor(tweetInfo: TweetInfo) {
    super()
    this.tweetInfo = tweetInfo
  }
}
