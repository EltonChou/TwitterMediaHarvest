import { getExtensionURL, i18nLocalize } from '../../libs/chromeApi'


enum TemplateType {
  Basic = 'basic',
  Image = 'image',
  List = 'list',
  Progress = 'progress'
}

const notificationIconUrl = getExtensionURL('assets/icons/icon128.png')
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
  ): chrome.notifications.NotificationOptions {
    const prevMsg = i18nLocalize('notificationDLFailedMessageFirst')
    const lastMsg = i18nLocalize('notificationDLFailedMessageLast')
    const message = `${prevMsg}${tweetInfo.screenName}(${tweetInfo.tweetId})${lastMsg}` +
      `${i18nLocalize('userCanceledMessage')}`

    return {
      type: TemplateType.Basic,
      iconUrl: notificationIconUrl,
      title: i18nLocalize('notificationDLFailedTitle'),
      message: message,
      contextMessage: contextMessage,
      buttons: [NotificationButton.viewTweet(), NotificationButton.retryDownload()],
      eventTime: eventTime,
      requireInteraction: true,
    }
  }

  static tooManyRequests(
    tweetInfo: TweetInfo,
    { title, message }: FetchErrorReason
  ): chrome.notifications.NotificationOptions {

    const prevMsg = i18nLocalize('notificationDLFailedMessageFirst')
    const lastMsg = i18nLocalize('notificationDLFailedMessageLast')
    const info = `${prevMsg}${tweetInfo.screenName}(${tweetInfo.tweetId})${lastMsg} ${message}`

    return {
      type: TemplateType.Basic,
      iconUrl: notificationIconUrl,
      title: title,
      message: info,
      contextMessage: contextMessage,
      buttons: [NotificationButton.viewTweet(),],
      eventTime: Date.now(),
      requireInteraction: true,
      silent: false,
    }
  }

  static unknownFetchError = (
    { title, message }: FetchErrorReason
  ): chrome.notifications.NotificationOptions => {
    return {
      type: TemplateType.Basic,
      iconUrl: notificationIconUrl,
      title: title,
      message: message,
      contextMessage: contextMessage,
      eventTime: Date.now(),
      requireInteraction: true,
      silent: false,
    }
  }

  static internalError = (message: string): chrome.notifications.NotificationOptions => {
    return {
      type: TemplateType.Basic,
      iconUrl: notificationIconUrl,
      title: i18nLocalize('internalError'),
      message: message,
      contextMessage: contextMessage,
      eventTime: Date.now(),
      requireInteraction: true,
      silent: false,
    }
  }
}

