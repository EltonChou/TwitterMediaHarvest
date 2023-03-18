import type { Notifications } from 'webextension-polyfill'
import browser from 'webextension-polyfill'

enum TemplateType {
  Basic = 'basic',
  Image = 'image',
  List = 'list',
  Progress = 'progress',
}

const i18nLocalize = (kw: string) => browser.i18n.getMessage(kw)
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
    const prevMsg = i18nLocalize('notificationDLFailedMessageFirst')
    const lastMsg = i18nLocalize('notificationDLFailedMessageLast')
    const message =
      `${prevMsg}${tweetInfo.screenName}(${tweetInfo.tweetId})${lastMsg}` + `${i18nLocalize('userCanceledMessage')}`

    return {
      type: TemplateType.Basic,
      iconUrl: notificationIconUrl,
      title: i18nLocalize('notificationDLFailedTitle'),
      message: message,
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
    const prevMsg = i18nLocalize('notificationDLFailedMessageFirst')
    const lastMsg = i18nLocalize('notificationDLFailedMessageLast')
    const info = `${prevMsg}${tweetInfo.screenName}(${tweetInfo.tweetId})${lastMsg} ${message}`

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
