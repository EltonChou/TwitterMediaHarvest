import type { Notifications } from 'webextension-polyfill'
import browser from 'webextension-polyfill'
import { i18nLocalize } from '../utils/i18n'

enum TemplateType {
  Basic = 'basic',
  Image = 'image',
  List = 'list',
  Progress = 'progress',
}

const notificationIconUrl = browser.runtime.getURL('assets/icons/icon128.png')
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
  static downloadError(tweetInfo: TweetInfo, eventTime: number): Notifications.CreateNotificationOptions {
    const info = i18nLocalize('notificationDLFailedMessage', [tweetInfo.screenName, tweetInfo.tweetId])

    return {
      type: TemplateType.Basic,
      iconUrl: notificationIconUrl,
      title: i18nLocalize('notificationDLFailedTitle'),
      message: info,
      contextMessage: contextMessage,
      buttons: [NotificationButton.viewTweet(), NotificationButton.retryDownload()],
      eventTime: eventTime,
      requireInteraction: true,
    } as Notifications.CreateNotificationOptions
  }

  static tooManyRequests(
    tweetInfo: TweetInfo,
    { title, message }: FetchErrorReason
  ): Notifications.CreateNotificationOptions {
    const info = i18nLocalize('notificationDLFailedMessage', [tweetInfo.screenName, tweetInfo.tweetId])

    return {
      type: TemplateType.Basic,
      iconUrl: notificationIconUrl,
      title: title,
      message: info,
      contextMessage: contextMessage,
      buttons: [NotificationButton.viewTweet()],
      eventTime: Date.now(),
      requireInteraction: true,
      silent: false,
    } as Notifications.CreateNotificationOptions
  }

  static unknownFetchError = ({ title, message }: FetchErrorReason): Notifications.CreateNotificationOptions => {
    return {
      type: TemplateType.Basic,
      iconUrl: notificationIconUrl,
      title: title,
      message: message,
      contextMessage: contextMessage,
      buttons: [NotificationButton.viewTweet()],
      eventTime: Date.now(),
      requireInteraction: true,
      silent: false,
    } as Notifications.CreateNotificationOptions
  }

  static internalError = (message: string): Notifications.CreateNotificationOptions => {
    return {
      type: TemplateType.Basic,
      iconUrl: notificationIconUrl,
      title: i18nLocalize('internalError'),
      message: message,
      contextMessage: contextMessage,
      buttons: [NotificationButton.viewTweet()],
      eventTime: Date.now(),
      requireInteraction: true,
      silent: false,
    } as Notifications.CreateNotificationOptions
  }
}
