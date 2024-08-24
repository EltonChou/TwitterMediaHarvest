import TweetFetchErrorNotificationInteracted from './TweetFetchErrorNotificationInteracted'

export default class TweetFetchErrorNotificationClicked extends TweetFetchErrorNotificationInteracted {
  constructor(tweetId: string) {
    super('notification:tweetFetchError:self:clicked', tweetId)
  }
}
