import { DomainEvent } from './base'

export default abstract class TweetFetchErrorNotificationInteracted
  extends DomainEvent
  implements TweetFetchingFailedNotificationEvent
{
  readonly tweetId: string

  constructor(name: DomainEvent['name'], tweetId: string) {
    super(name)
    this.tweetId = tweetId
  }
}
