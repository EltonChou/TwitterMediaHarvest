import DownloadCompleted from '#domain/events/DownloadCompleted'
import DownloadFailedNotificationClicked from '#domain/events/DownloadFailedNotificationClicked'
import DownloadFailedNotificationClosed from '#domain/events/DownloadFailedNotificationClosed'
import DownloadFailedNotificationRetryButtonClicked from '#domain/events/DownloadFailedNotificationRetryButtonClicked'
import DownloadFailedNotificationViewButtonClicked from '#domain/events/DownloadFailedNotificationViewButtonClicked'
import RuntimeInstalled from '#domain/events/RuntimeInstalled'
import RuntimeUpdated from '#domain/events/RuntimeUpdated'
import TweetFetchErrorNotificationClicked from '#domain/events/TweetFetchErrorNotificationClicked'
import TweetFetchErrorNotificationClosed from '#domain/events/TweetFetchErrorNotificationClosed'
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
import { getEventPublisher } from '#infra/eventPublisher'
import Browser from 'webextension-polyfill'

const eventPublisher = getEventPublisher()

Browser.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  // TODO: action router
})

Browser.runtime.onInstalled.addListener(async details => {
  const currentVersion = Browser.runtime.getManifest().version

  if (details.reason === 'browser_update') return

  if (details.reason === 'install') {
    await eventPublisher.publish(new RuntimeInstalled(currentVersion))
  }

  if (details.reason === 'update') {
    await eventPublisher.publish(
      new RuntimeUpdated({
        current: currentVersion,
        previous: details.previousVersion ?? currentVersion,
      })
    )
  }
})

Browser.downloads.onChanged.addListener(async downloadDelta => {
  // Only focus on state.
  if ('state' in downloadDelta) {
    // TODO: Check is triggered by self.

    await eventPublisher.publish(new DownloadCompleted(downloadDelta.id))
  }
})

Browser.notifications.onClosed.addListener(notificationId => {
  if (isTweetFetchId(notificationId)) {
    const tweetId = extractTweetId(notificationId)
    eventPublisher.publish(new TweetFetchErrorNotificationClosed(tweetId))
    return
  }

  if (isDownloadId(notificationId)) {
    const downloadId = extractDownloadId(notificationId)
    eventPublisher.publish(new DownloadFailedNotificationClosed(downloadId))
    return
  }
})

Browser.notifications.onClicked.addListener(notificationId => {
  if (isTweetFetchId(notificationId)) {
    const tweetId = extractTweetId(notificationId)
    eventPublisher.publish(new TweetFetchErrorNotificationClicked(tweetId))
    return
  }

  if (isDownloadId(notificationId)) {
    const downloadId = extractDownloadId(notificationId)
    eventPublisher.publish(new DownloadFailedNotificationClicked(downloadId))
    return
  }
})

Browser.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
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

    eventPublisher.publish(event)

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

    eventPublisher.publish(event)
    return
  }

  return
})
