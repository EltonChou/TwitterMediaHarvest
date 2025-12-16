/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import type { Factory } from '#domain/factories/base'
import type { PropsOf } from '#domain/valueObjects/base'
import type { TweetInfo } from '#domain/valueObjects/tweetInfo'
import { getText } from '#libs/i18n'
import {
  DownloadNotificationButton,
  FilenameNotificationButton,
  TweetNotificationButton,
} from './notificationButton'
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

const createNotificationOptions = ({
  buttons,
  requireInteraction,
  ...options
}: { type?: TemplateType } & Omit<
  Notifications.CreateNotificationOptions,
  'type'
> &
  Pick<
    chrome.notifications.NotificationOptions,
    'buttons' | 'requireInteraction'
  >): Notifications.CreateNotificationOptions => ({
  type: TemplateType.Basic,
  iconUrl: getNotificationIconUrl(),
  contextMessage: NOTIFICATION_CONTEXT_MESSAGE,
  eventTime: Date.now(),
  ...options,
  ...(__BROWSER__ === 'firefox'
    ? {}
    : {
        buttons,
        requireInteraction,
      }),
})

export const enum MediaDownloadNotificationErrorButton {
  ViewTweet = 0,
  RetryDownload = 1,
}

export class MediaDownloadNotificationConfig {
  static error(
    tweetInfo: PropsOf<TweetInfo>,
    eventTime: Date
  ): Notifications.CreateNotificationOptions {
    const info = getText(
      'Media in {{account}}({{tweet-id}}) download failed.',
      'notification:download',
      { account: tweetInfo.screenName, 'tweet-id': tweetInfo.tweetId }
    )

    return createNotificationOptions({
      title: getText('Download failed', 'notification:download'),
      message: info,
      eventTime: eventTime.getTime(),
      buttons: [
        TweetNotificationButton.viewTweet(),
        DownloadNotificationButton.retryDownload(),
      ],
      requireInteraction: true,
    })
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
  return createNotificationOptions({
    title: title,
    message: message,
    eventTime: eventTime.getTime(),
    buttons: [TweetNotificationButton.viewTweet()],
    requireInteraction: true,
  })
}

type TweetFetchErrorNotificationConfigParams = {
  tweetInfo: PropsOf<TweetInfo>
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

  static failedToParseTweetInfo(): Notifications.CreateNotificationOptions {
    return createNotificationOptions({
      title: getText(
        'Failed to parse tweet information',
        'notification:parseTweetInfo'
      ),
      message: getText(
        'Failed to parse tweet information. Please report bug to developer.',
        'notification:parseTweetInfo'
      ),
    })
  }
}

export const enum FilenameOverwirrtenNotificationButton {
  Ignore = 0,
  Diagnose = 1,
}

export const makeFilenameIsOverwrittenNotificationConfig: Factory<
  FilenameOverwrittenEvent,
  Notifications.CreateNotificationOptions
> = event =>
  createNotificationOptions({
    title: getText('WARNING: Filename is modified', 'notification:filename'),
    message: getText(
      "The filename is modified by other extensions, please check extensions' settings.",
      'notification:filename'
    ),
    eventTime: event.occuredAt.getTime(),
    buttons: [
      FilenameNotificationButton.diagnose(),
      FilenameNotificationButton.ignore(),
    ],
  })

export class SolutionQuotaWarningNotificationConfig {
  static native(params: {
    remainingQuota: number
    resetTime: Date
    eventTime?: Date
    requireInteraction?: boolean
  }): Notifications.CreateNotificationOptions {
    return createNotificationOptions({
      title: getText('Download Quota Warning', 'notification:quota'),
      message: getText(
        'Remaining quota: {{quota}}. Resets at {{time}}',
        'notification:quota',
        {
          quota: params.remainingQuota.toString(),
          time: params.resetTime.toLocaleString(),
        }
      ),
      eventTime: params.eventTime ? params.eventTime.getTime() : Date.now(),
      requireInteraction: params.requireInteraction,
      // TODO: Add a button which will redirect user to Q&A page when clicked.
    })
  }
}
