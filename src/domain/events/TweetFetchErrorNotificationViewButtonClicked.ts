import TweetFetchErrorNotificationInteracted from './TweetFetchErrorNotificationInteracted'

export default class TweetFetchErrorNotificationViewButtonClicked extends TweetFetchErrorNotificationInteracted {
  constructor(tweetInfo: TweetInfo) {
    super('notification:tweetFetchError:viewButton:clicked', tweetInfo)
  }
}
