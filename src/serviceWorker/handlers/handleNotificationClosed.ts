import type { DomainEventPublisher } from '#domain/eventPublisher'
import DownloadFailedNotificationClosed from '#domain/events/DownloadFailedNotificationClosed'
import TweetFetchErrorNotificationClosed from '#domain/events/TweetFetchErrorNotificationClosed'
import {
  extractDownloadId,
  extractTweetId,
  isDownloadId,
  isTweetFetchId,
} from '#helpers/notificationId'

const handleNotificationClosed =
  (publisher: DomainEventPublisher) =>
  async (notificationId: string, byUser: boolean) => {
    if (isTweetFetchId(notificationId)) {
      const tweetId = extractTweetId(notificationId)
      await publisher.publish(new TweetFetchErrorNotificationClosed(tweetId))
      return
    }

    if (isDownloadId(notificationId)) {
      const downloadId = extractDownloadId(notificationId)
      await publisher.publish(new DownloadFailedNotificationClosed(downloadId))
      return
    }
  }

export default handleNotificationClosed
