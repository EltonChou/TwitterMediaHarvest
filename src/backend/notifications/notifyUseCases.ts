import { TooManyRequest, TwitterApiError } from '../errors'
import { NotificationConfig } from './helpers'
import {
  makeDownloadFailedNotificationId,
  makeFetchErrorNotificationId,
} from './utils/notificationId'
import type { Downloads } from 'webextension-polyfill'
import browser from 'webextension-polyfill'

export class FetchErrorNotificationUseCase {
  constructor(readonly tweetInfo: TweetInfo) {}

  async notify(err: TwitterApiError): Promise<void> {
    let notiConf = NotificationConfig.unknownFetchError(err.reason)
    if (err instanceof TooManyRequest) {
      notiConf = NotificationConfig.tooManyRequests(this.tweetInfo, err.reason)
    }

    await browser.notifications.create(
      makeFetchErrorNotificationId(this.tweetInfo.tweetId),
      notiConf
    )
  }
}

export class InternalErrorNotificationUseCase {
  constructor(readonly tweetInfo: TweetInfo) {}

  async notify(err: Error) {
    const notiConf = NotificationConfig.internalError(err.message)
    await browser.notifications.create(
      makeFetchErrorNotificationId(this.tweetInfo.tweetId),
      notiConf
    )
  }
}

export class DownwloadFailedNotificationUseCase {
  readonly tweetInfo: TweetInfo

  constructor(tweetInfo: TweetInfo) {
    this.tweetInfo = tweetInfo
  }

  async notify(downloadDelta: Downloads.OnChangedDownloadDeltaType): Promise<void> {
    const notiConf = NotificationConfig.downloadError(
      this.tweetInfo,
      getDownloadDeltaEventTime(downloadDelta)
    )

    await browser.notifications.create(
      makeDownloadFailedNotificationId(downloadDelta.id),
      notiConf
    )
  }
}

export class FailedToParseTweetInfoNotifyUseCase {
  async notify(): Promise<void> {
    const notiConf = NotificationConfig.failedToParseTweetInfo()

    await browser.notifications.create('none', notiConf)
  }
}

function getDownloadDeltaEventTime(downloadDelta: Downloads.OnChangedDownloadDeltaType) {
  const eventTime =
    !downloadDelta.error && 'current' in downloadDelta.endTime
      ? Date.parse(downloadDelta.endTime.current)
      : Date.now()

  return eventTime
}
