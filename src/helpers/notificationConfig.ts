import { i18nLocalize } from '#libs/i18n'
import { DownloadNotificationButton, TweetNotificationButton } from './notificationButton'
import { isFirefox } from '@backend/utils/checker'
import type { Notifications } from 'webextension-polyfill'
import Browser from 'webextension-polyfill'

enum TemplateType {
  Basic = 'basic',
  Image = 'image',
  List = 'list',
  Progress = 'progress',
}

const CONTEXT_MSG = 'Media Harvest'

const getNotificationIconUrl = () => Browser.runtime.getURL('assets/icons/icon@128.png')

export class MediaDownloadNotificationConfig {
  error(
    tweetInfo: TweetInfo,
    eventTime: number
  ): Notifications.CreateNotificationOptions {
    const info = i18nLocalize('notificationDLFailedMessage', [
      tweetInfo.screenName,
      tweetInfo.tweetId,
    ])

    return {
      type: TemplateType.Basic,
      iconUrl: getNotificationIconUrl(),
      title: i18nLocalize('notificationDLFailedTitle'),
      message: info,
      contextMessage: CONTEXT_MSG,
      eventTime: eventTime,
      ...(isFirefox()
        ? {}
        : {
            buttons: [
              TweetNotificationButton.viewTweet(),
              DownloadNotificationButton.retryDownload(),
            ],
            requireInteraction: true,
          }),
    }
  }
}

export class TweetFetchErrorNotificationConfig {
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
      iconUrl: getNotificationIconUrl(),
      title: title,
      message: info,
      contextMessage: CONTEXT_MSG,
      eventTime: Date.now(),
      ...(isFirefox()
        ? {}
        : { buttons: [TweetNotificationButton.viewTweet()], requireInteraction: true }),
    }
  }

  static unknownFetchError = ({
    title,
    message,
  }: FetchErrorReason): Notifications.CreateNotificationOptions => {
    return {
      type: TemplateType.Basic,
      iconUrl: getNotificationIconUrl(),
      title: title,
      message: message,
      contextMessage: CONTEXT_MSG,
      eventTime: Date.now(),
      ...(isFirefox()
        ? {}
        : { buttons: [TweetNotificationButton.viewTweet()], requireInteraction: true }),
    }
  }

  static internalError = (message: string): Notifications.CreateNotificationOptions => {
    return {
      type: TemplateType.Basic,
      iconUrl: getNotificationIconUrl(),
      title: i18nLocalize('internalError'),
      message: message,
      contextMessage: CONTEXT_MSG,
      eventTime: Date.now(),
      ...(isFirefox()
        ? {}
        : { buttons: [TweetNotificationButton.viewTweet()], requireInteraction: true }),
    }
  }

  static failedToParseTweetInfo = (): Notifications.CreateNotificationOptions => {
    return {
      type: TemplateType.Basic,
      iconUrl: getNotificationIconUrl(),
      title: i18nLocalize('notification-failedToParseTweetInfo-title'),
      message: i18nLocalize('notification-failedToParseTweetInfo-message'),
      contextMessage: CONTEXT_MSG,
      eventTime: Date.now(),
    }
  }
}
