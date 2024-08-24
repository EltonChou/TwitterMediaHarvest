import TweetFetchErrorNotificationInteracted from './TweetFetchErrorNotificationInteracted'

export default class TweetFetchErrorNotificationClosed extends TweetFetchErrorNotificationInteracted {
  constructor(tweetId: string) {
    super('notification:tweetFetchError:self:closed', tweetId)
  }
}
