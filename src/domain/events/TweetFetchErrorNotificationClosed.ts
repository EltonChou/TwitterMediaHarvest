import TweetFetchErrorNotificationInteracted from './TweetFetchErrorNotificationInteracted'

export default class TweetFetchErrorNotificationClosed extends TweetFetchErrorNotificationInteracted {
  constructor(tweetInfo: TweetInfo) {
    super('notification:tweetFetchError:self:closed', tweetInfo)
  }
}
