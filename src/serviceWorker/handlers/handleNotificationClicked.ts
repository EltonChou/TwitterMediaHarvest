import type { DomainEventPublisher } from '#domain/eventPublisher'
import DownloadFailedNotificationClicked from '#domain/events/DownloadFailedNotificationClicked'
import TweetFetchErrorNotificationClicked from '#domain/events/TweetFetchErrorNotificationClicked'
import {
  extractDownloadId,
  extractTweetId,
  isDownloadId,
  isTweetFetchId,
} from '#helpers/notificationId'

const handleNotificationClicked =
  (publisher: DomainEventPublisher) => async (notificationId: string) => {
    if (isTweetFetchId(notificationId)) {
      const tweetId = extractTweetId(notificationId)
      await publisher.publish(new TweetFetchErrorNotificationClicked(tweetId))
      return
    }

    if (isDownloadId(notificationId)) {
      const downloadId = extractDownloadId(notificationId)
      await publisher.publish(new DownloadFailedNotificationClicked(downloadId))
      return
    }
  }

export default handleNotificationClicked
