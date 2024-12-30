import { getText } from '#libs/i18n'
import { DownloadNotificationButton, TweetNotificationButton } from './notificationButton'
import { isFirefox } from './runtime'
import type { Notifications } from 'webextension-polyfill'
import Browser from 'webextension-polyfill'

const NOTIFICATION_CONTEXT_MESSAGE = 'Media Harvest'

const enum TemplateType {
  Basic = 'basic',
  Image = 'image',
  List = 'list',
  Progress = 'progress',
}

const getNotificationIconUrl = () => Browser.runtime.getURL('assets/icons/icon@128.png')

export const enum MediaDownloadNotificationErrorButton {
  ViewTweet = 0,
  RetryDownload = 1,
}

export class MediaDownloadNotificationConfig {
  static error(
    tweetInfo: TweetInfo,
    eventTime: Date
  ): Notifications.CreateNotificationOptions {
    const info = getText(
      'Media in {{account}}({{tweet-id}}) download failed.',
      'notification:download:failed',
      { account: tweetInfo.screenName, 'tweet-id': tweetInfo.tweetId }
    )

    return {
      type: TemplateType.Basic,
      iconUrl: getNotificationIconUrl(),
      title: getText('Download failed', 'notification:download:failed'),
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

export const enum GeneralTweetFetchErrorNotificationButton {
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
    const info = getText(
      'Media in {{account}}({{tweet-id}}) download failed.',
      'notification:download:failed',
      {
        account: params.tweetInfo.screenName,
        'tweet-id': params.tweetInfo.tweetId,
      }
    )

    return makeGeneralTweetFetchErrorNotificationConfig({
      title: getText('Download failed', 'notification:donwload:failed'),
      message: info,
      eventTime: params.eventTime,
    })
  }

  static notFound(
    params: TweetFetchErrorNotificationConfigParams
  ): Notifications.CreateNotificationOptions {
    return makeGeneralTweetFetchErrorNotificationConfig({
      title: getText('The tweet cannot be found', 'notification:tweetFetch:error'),
      message: getText('The tweet might be deleted.', 'notification:tweetFetch:error'),
      eventTime: params.eventTime,
    })
  }

  static unauthorized(
    params: TweetFetchErrorNotificationConfigParams
  ): Notifications.CreateNotificationOptions {
    return makeGeneralTweetFetchErrorNotificationConfig({
      title: getText('Unauthorized', 'notification:tweetFetch:error'),
      message: getText(
        'Please check your login session and your permission.',
        'notification:tweetFetch:error'
      ),
      eventTime: params.eventTime,
    })
  }

  static forbidden(
    params: TweetFetchErrorNotificationConfigParams
  ): Notifications.CreateNotificationOptions {
    return makeGeneralTweetFetchErrorNotificationConfig({
      title: getText('Forbidden', 'notification:tweetFetch:error'),
      message: getText(
        'Your login session might be expired, please refresh the session.',
        'notification:tweetFetch:error'
      ),
      eventTime: params.eventTime,
    })
  }

  static unknown(
    params: TweetFetchErrorNotificationConfigParams & { code: number }
  ): Notifications.CreateNotificationOptions {
    return makeGeneralTweetFetchErrorNotificationConfig({
      title: getText('Unknown Error ({{code}})', 'notification:tweetFetch:error', {
        code: params.code.toString(),
      }),
      message: getText('Please contact with developer', 'notification:tweetFetch:error'),
      eventTime: params.eventTime,
    })
  }

  static failedToParseTweetInfo = (): Notifications.CreateNotificationOptions => {
    return {
      type: TemplateType.Basic,
      iconUrl: getNotificationIconUrl(),
      title: getText(
        'Failed to parse tweet information',
        'notification:parseTweetInfo:failed'
      ),
      message: getText(
        'Failed to parse tweet information. Please report bug to developer.',
        'notification:parseTweetInfo:failed'
      ),
      contextMessage: NOTIFICATION_CONTEXT_MESSAGE,
      eventTime: Date.now(),
    }
  }
}
