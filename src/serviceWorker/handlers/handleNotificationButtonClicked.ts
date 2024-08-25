import type { DomainEventPublisher } from '#domain/eventPublisher'
import DownloadFailedNotificationRetryButtonClicked from '#domain/events/DownloadFailedNotificationRetryButtonClicked'
import DownloadFailedNotificationViewButtonClicked from '#domain/events/DownloadFailedNotificationViewButtonClicked'
import TweetFetchErrorNotificationViewButtonClicked from '#domain/events/TweetFetchErrorNotificationViewButtonClicked'
import { UnknownNotificationButtonClicked } from '#domain/events/UnknownNotificationButtonClicked'
import {
  GeneralTweetFetchErrorNotificationButton,
  MediaDownloadNotificationErrorButton,
} from '#helpers/notificationConfig'
import {
  extractDownloadId,
  extractTweetId,
  isDownloadId,
  isTweetFetchId,
} from '#helpers/notificationId'

const handleNotificationButtonClicked =
  (publisher: DomainEventPublisher) =>
  async (notificationId: string, buttonIndex: number) => {
    if (isTweetFetchId(notificationId)) {
      const tweetId = extractTweetId(notificationId)

      let event: IDomainEvent
      switch (buttonIndex) {
        case GeneralTweetFetchErrorNotificationButton.ViewTweet:
          event = new TweetFetchErrorNotificationViewButtonClicked(tweetId)
          break

        default:
          event = new UnknownNotificationButtonClicked(buttonIndex)
          break
      }

      await publisher.publish(event)

      return
    }

    if (isDownloadId(notificationId)) {
      const downloadId = extractDownloadId(notificationId)

      let event: IDomainEvent
      switch (buttonIndex) {
        case MediaDownloadNotificationErrorButton.RetryDownload:
          event = new DownloadFailedNotificationRetryButtonClicked(downloadId)
          break

        case MediaDownloadNotificationErrorButton.ViewTweet:
          event = new DownloadFailedNotificationViewButtonClicked(downloadId)
          break

        default:
          event = new UnknownNotificationButtonClicked(buttonIndex)
          break
      }

      await publisher.publish(event)
      return
    }
  }

export default handleNotificationButtonClicked
