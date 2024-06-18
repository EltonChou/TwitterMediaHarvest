import { DomainEvent } from './base'

export default abstract class TweetFetchErrorNotificationInteracted
  extends DomainEvent
  implements TweetFetchErrorNotificationEvent
{
  readonly tweetInfo: TweetInfo

  constructor(name: DomainEvent['name'], tweetInfo: TweetInfo) {
    super(name)
    this.tweetInfo = tweetInfo
  }
}
