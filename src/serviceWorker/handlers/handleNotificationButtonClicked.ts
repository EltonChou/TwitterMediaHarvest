import type { DomainEventPublisher } from '#domain/eventPublisher'
import DownloadFailedNotificationRetryButtonClicked from '#domain/events/DownloadFailedNotificationRetryButtonClicked'
import DownloadFailedNotificationViewButtonClicked from '#domain/events/DownloadFailedNotificationViewButtonClicked'
// eslint-disable-next-line max-len
import { FilenameOverwrittenNotificationIgnoreButtonClicked } from '#domain/events/FilenameOverwrittenNotificationIgnoreButtonClicked'
import TweetFetchErrorNotificationViewButtonClicked from '#domain/events/TweetFetchErrorNotificationViewButtonClicked'
import { UnknownNotificationButtonClicked } from '#domain/events/UnknownNotificationButtonClicked'
import {
  FilenameOverwirrtenNotificationButton,
  GeneralTweetFetchErrorNotificationButton,
  MediaDownloadNotificationErrorButton,
} from '#helpers/notificationConfig'
import {
  extractDownloadId,
  extractTweetId,
  isDownloadId,
  isFilenameOverWrittenId,
  isTweetFetchId,
} from '#helpers/notificationId'
import type { Notifications } from 'webextension-polyfill'

const handleNotificationButtonClicked =
  (
    publisher: DomainEventPublisher
  ): ListenerOf<Notifications.Static['onButtonClicked']> =>
  async (notificationId, buttonIndex) => {
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

    if (isFilenameOverWrittenId(notificationId)) {
      if (buttonIndex === FilenameOverwirrtenNotificationButton.Ignore)
        await publisher.publish(
          new FilenameOverwrittenNotificationIgnoreButtonClicked()
        )
    }
  }

export default handleNotificationButtonClicked
