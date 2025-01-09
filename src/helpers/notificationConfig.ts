import type { Factory } from '#domain/factories/base'
import { getText } from '#libs/i18n'
import {
  DownloadNotificationButton,
  FilenameNotificationButton,
  TweetNotificationButton,
} from './notificationButton'
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

const getNotificationIconUrl = () =>
  Browser.runtime.getURL('assets/icons/icon@128.png')

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
      'notification:download',
      { account: tweetInfo.screenName, 'tweet-id': tweetInfo.tweetId }
    )

    return {
      type: TemplateType.Basic,
      iconUrl: getNotificationIconUrl(),
      title: getText('Download failed', 'notification:download'),
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
      : {
          buttons: [TweetNotificationButton.viewTweet()],
          requireInteraction: true,
        }),
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
    return makeGeneralTweetFetchErrorNotificationConfig({
      title: getText('Too many requests', 'notification:download'),
      message: getText('API Rate limit exceeded.', 'notification:download'),
      eventTime: params.eventTime,
    })
  }

  static notFound(
    params: TweetFetchErrorNotificationConfigParams
  ): Notifications.CreateNotificationOptions {
    return makeGeneralTweetFetchErrorNotificationConfig({
      title: getText('The tweet cannot be found', 'notification:tweetFetch'),
      message: getText(
        'The tweet might be deleted.',
        'notification:tweetFetch'
      ),
      eventTime: params.eventTime,
    })
  }

  static unauthorized(
    params: TweetFetchErrorNotificationConfigParams
  ): Notifications.CreateNotificationOptions {
    return makeGeneralTweetFetchErrorNotificationConfig({
      title: getText('Unauthorized', 'notification:tweetFetch'),
      message: getText(
        'Please check your login session and your permission.',
        'notification:tweetFetch'
      ),
      eventTime: params.eventTime,
    })
  }

  static forbidden(
    params: TweetFetchErrorNotificationConfigParams
  ): Notifications.CreateNotificationOptions {
    return makeGeneralTweetFetchErrorNotificationConfig({
      title: getText('Forbidden', 'notification:tweetFetch'),
      message: getText(
        'Your login session might be expired, please refresh the session.',
        'notification:tweetFetch'
      ),
      eventTime: params.eventTime,
    })
  }

  static unknown(
    params: TweetFetchErrorNotificationConfigParams & { code: number }
  ): Notifications.CreateNotificationOptions {
    return makeGeneralTweetFetchErrorNotificationConfig({
      title: getText('Unknown Error ({{code}})', 'notification:tweetFetch', {
        code: params.code.toString(),
      }),
      message: getText(
        'Please contact with developer.',
        'notification:tweetFetch'
      ),
      eventTime: params.eventTime,
    })
  }

  static failedToParseTweetInfo =
    (): Notifications.CreateNotificationOptions => {
      return {
        type: TemplateType.Basic,
        iconUrl: getNotificationIconUrl(),
        title: getText(
          'Failed to parse tweet information',
          'notification:parseTweetInfo'
        ),
        message: getText(
          'Failed to parse tweet information. Please report bug to developer.',
          'notification:parseTweetInfo'
        ),
        contextMessage: NOTIFICATION_CONTEXT_MESSAGE,
        eventTime: Date.now(),
      }
    }
}

export const enum FilenameOverwirrtenNotificationButton {
  Ignore = 0,
}

export const makeFilenameIsOverwrittenNotificationConfig: Factory<
  FilenameOverwrittenEvent,
  Notifications.CreateNotificationOptions
> = event => {
  return {
    type: TemplateType.Basic,
    iconUrl: getNotificationIconUrl(),
    title: getText('WARNING: Filename is modified', 'notification:filename'),
    message: getText(
      // eslint-disable-next-line quotes
      "The filename is modified by other extensions, please check extensions' settings.",
      'notification:filename'
    ),
    contextMessage: NOTIFICATION_CONTEXT_MESSAGE,
    eventTime: event.occuredAt.getTime(),
    ...(isFirefox()
      ? {}
      : {
          buttons: [FilenameNotificationButton.ignore()],
        }),
  }
}
