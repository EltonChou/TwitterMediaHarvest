import { DomainEvent } from './base'

export default abstract class TweetFetchErrorNotificationInteracted
  extends DomainEvent
  implements TweetInfoEvent
{
  readonly tweetInfo: TweetInfo

  constructor(name: DomainEvent['name'], tweetInfo: TweetInfo) {
    super(name)
    this.tweetInfo = tweetInfo
  }
}
