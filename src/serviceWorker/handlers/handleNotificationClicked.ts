import type { DomainEventPublisher } from '#domain/eventPublisher'
import DownloadFailedNotificationClicked from '#domain/events/DownloadFailedNotificationClicked'
import { FilenameOverwrittenNotificationClicked } from '#domain/events/FilenameOverwrittenNotificationClicked'
import TweetFetchErrorNotificationClicked from '#domain/events/TweetFetchErrorNotificationClicked'
import {
  extractDownloadId,
  extractTweetId,
  isDownloadId,
  isFilenameOverWrittenId,
  isTweetFetchId,
} from '#helpers/notificationId'
import type { Notifications } from 'webextension-polyfill'

const handleNotificationClicked =
  (publisher: DomainEventPublisher): ListenerOf<Notifications.Static['onClicked']> =>
  async notificationId => {
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

    if (isFilenameOverWrittenId(notificationId)) {
      await publisher.publish(new FilenameOverwrittenNotificationClicked())
    }
  }

export default handleNotificationClicked
