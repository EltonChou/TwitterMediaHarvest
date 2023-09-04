import { i18nLocalize } from '../utils/i18n'
import { isFirefox } from '@backend/utils/checker'
import type { Notifications } from 'webextension-polyfill'
import browser from 'webextension-polyfill'

enum TemplateType {
  Basic = 'basic',
  Image = 'image',
  List = 'list',
  Progress = 'progress',
}

const notificationIconUrl = browser.runtime.getURL('assets/icons/icon@128.png')
const contextMessage = 'Media Harvest'

class NotificationButton {
  static viewTweet(): chrome.notifications.ButtonOptions {
    return {
      title: i18nLocalize('notificationDLFailedButton1'),
    }
  }

  static retryDownload(): chrome.notifications.ButtonOptions {
    return {
      title: i18nLocalize('notificationDLFailedButton2'),
    }
  }
}

export class NotificationConfig {
  static downloadError(
    tweetInfo: TweetInfo,
    eventTime: number
  ): Notifications.CreateNotificationOptions {
    const info = i18nLocalize('notificationDLFailedMessage', [
      tweetInfo.screenName,
      tweetInfo.tweetId,
    ])

    return {
      type: TemplateType.Basic,
      iconUrl: notificationIconUrl,
      title: i18nLocalize('notificationDLFailedTitle'),
      message: info,
      contextMessage: contextMessage,
      eventTime: eventTime,
      ...(isFirefox()
        ? {}
        : {
            buttons: [NotificationButton.viewTweet(), NotificationButton.retryDownload()],
            requireInteraction: true,
          }),
    }
  }

  static tooManyRequests(
    tweetInfo: TweetInfo,
    { title, message }: FetchErrorReason
  ): Notifications.CreateNotificationOptions {
    const info = i18nLocalize('notificationDLFailedMessage', [
      tweetInfo.screenName,
      tweetInfo.tweetId,
    ])

    return {
      type: TemplateType.Basic,
      iconUrl: notificationIconUrl,
      title: title,
      message: info,
      contextMessage: contextMessage,
      eventTime: Date.now(),
      buttons: [NotificationButton.viewTweet()],
      requireInteraction: true,
      ...(isFirefox()
        ? {}
        : { buttons: [NotificationButton.viewTweet()], requireInteraction: true }),
    }
  }

  static unknownFetchError = ({
    title,
    message,
  }: FetchErrorReason): Notifications.CreateNotificationOptions => {
    return {
      type: TemplateType.Basic,
      iconUrl: notificationIconUrl,
      title: title,
      message: message,
      contextMessage: contextMessage,
      eventTime: Date.now(),
      ...(isFirefox()
        ? {}
        : { buttons: [NotificationButton.viewTweet()], requireInteraction: true }),
    }
  }

  static internalError = (message: string): Notifications.CreateNotificationOptions => {
    return {
      type: TemplateType.Basic,
      iconUrl: notificationIconUrl,
      title: i18nLocalize('internalError'),
      message: message,
      contextMessage: contextMessage,
      eventTime: Date.now(),
      ...(isFirefox()
        ? {}
        : { buttons: [NotificationButton.viewTweet()], requireInteraction: true }),
    }
  }

  static failedToParseTweetInfo = (): Notifications.CreateNotificationOptions => {
    return {
      type: TemplateType.Basic,
      iconUrl: notificationIconUrl,
      title: i18nLocalize('notification-failedToParseTweetInfo-title'),
      message: i18nLocalize('notification-failedToParseTweetInfo-message'),
      contextMessage: contextMessage,
      eventTime: Date.now(),
    }
  }
}
