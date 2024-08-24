import TweetFetchErrorNotificationInteracted from './TweetFetchErrorNotificationInteracted'

export default class TweetFetchErrorNotificationViewButtonClicked extends TweetFetchErrorNotificationInteracted {
  constructor(tweetId: string) {
    super('notification:tweetFetchError:viewButton:clicked', tweetId)
  }
}
