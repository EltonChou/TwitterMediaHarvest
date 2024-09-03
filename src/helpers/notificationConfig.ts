import { i18nLocalize } from '#libs/i18n'
import { DownloadNotificationButton, TweetNotificationButton } from './notificationButton'
import { isFirefox } from './runtime'
import type { Notifications } from 'webextension-polyfill'
import Browser from 'webextension-polyfill'

const NOTIFICATION_CONTEXT_MESSAGE = 'Media Harvest'

enum TemplateType {
  Basic = 'basic',
  Image = 'image',
  List = 'list',
  Progress = 'progress',
}

const getNotificationIconUrl = () => Browser.runtime.getURL('assets/icons/icon@128.png')

export enum MediaDownloadNotificationErrorButton {
  ViewTweet = 0,
  RetryDownload = 1,
}

export class MediaDownloadNotificationConfig {
  static error(
    tweetInfo: TweetInfo,
    eventTime: Date
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
      contextMessage: NOTIFICATION_CONTEXT_MESSAGE,
      eventTime: eventTime.getTime(),
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

export enum GeneralTweetFetchErrorNotificationButton {
  ViewTweet = 0,
}

type GeneralTweetFetchErrorNotificationConfigParams = {
  title: string
  message: string
  eventTime: Date
}

const makeGeneralTweetFetchErrorNotificationConfig = ({
  title,
  message,
  eventTime,
}: GeneralTweetFetchErrorNotificationConfigParams): Notifications.CreateNotificationOptions => {
  return {
    type: TemplateType.Basic,
    iconUrl: getNotificationIconUrl(),
    title: title,
    message: message,
    contextMessage: NOTIFICATION_CONTEXT_MESSAGE,
    eventTime: eventTime.getTime(),
    ...(isFirefox()
      ? {}
      : { buttons: [TweetNotificationButton.viewTweet()], requireInteraction: true }),
  }
}

type TweetFetchErrorNotificationConfigParams = {
  tweetInfo: TweetInfo
  eventTime: Date
}

export class TweetFetchErrorNotificationConfig {
  static tooManyRequests(
    params: TweetFetchErrorNotificationConfigParams
  ): Notifications.CreateNotificationOptions {
    const info = i18nLocalize('notificationDLFailedMessage', [
      params.tweetInfo.screenName,
      params.tweetInfo.tweetId,
    ])

    return makeGeneralTweetFetchErrorNotificationConfig({
      title: i18nLocalize('fetchFailedTooManyRequestsTitle'),
      message: info,
      eventTime: params.eventTime,
    })
  }

  static notFound(
    params: TweetFetchErrorNotificationConfigParams
  ): Notifications.CreateNotificationOptions {
    return makeGeneralTweetFetchErrorNotificationConfig({
      title: i18nLocalize('fetchFailedNotFoundTitle'),
      message: i18nLocalize('fetchFailedTooManyRequestsMessage'),
      eventTime: params.eventTime,
    })
  }

  static unauthorized(
    params: TweetFetchErrorNotificationConfigParams
  ): Notifications.CreateNotificationOptions {
    return makeGeneralTweetFetchErrorNotificationConfig({
      title: i18nLocalize('backend_notification_title_unauth'),
      message: i18nLocalize('backend_notification_message_unauth'),
      eventTime: params.eventTime,
    })
  }

  static forbidden(
    params: TweetFetchErrorNotificationConfigParams
  ): Notifications.CreateNotificationOptions {
    return makeGeneralTweetFetchErrorNotificationConfig({
      title: i18nLocalize('backend_notification_title_forbidden'),
      message: i18nLocalize('backend_notification_message_forbidden'),
      eventTime: params.eventTime,
    })
  }

  static unknown(
    params: TweetFetchErrorNotificationConfigParams & { code: number }
  ): Notifications.CreateNotificationOptions {
    return makeGeneralTweetFetchErrorNotificationConfig({
      title: i18nLocalize('fetchFailedUnknownTitle') + params.code,
      message: i18nLocalize('fetchFailedUnknownMessage'),
      eventTime: params.eventTime,
    })
  }

  static failedToParseTweetInfo = (): Notifications.CreateNotificationOptions => {
    return {
      type: TemplateType.Basic,
      iconUrl: getNotificationIconUrl(),
      title: i18nLocalize('notification-failedToParseTweetInfo-title'),
      message: i18nLocalize('notification-failedToParseTweetInfo-message'),
      contextMessage: NOTIFICATION_CONTEXT_MESSAGE,
      eventTime: Date.now(),
    }
  }
}

type MakeTweetParsingErrorNotificationConfigParams = {
  tweetInfo: TweetInfo
}

export const makeTweetParsingErrorNotificationConfig = (
  params: MakeTweetParsingErrorNotificationConfigParams
): Notifications.CreateNotificationOptions => {
  return {
    type: TemplateType.Basic,
    iconUrl: getNotificationIconUrl(),
    title: i18nLocalize('notification-failedToParseTweetInfo-title'),
    message: i18nLocalize('notification-failedToParseTweetInfo-message'),
    contextMessage: NOTIFICATION_CONTEXT_MESSAGE,
    eventTime: Date.now(),
  }
}
