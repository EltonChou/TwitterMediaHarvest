import { NotificationConfig } from './helpers'
import { makeDownloadFailedNotificationId, makeFetchErrorNotificationId } from './utils/notificationId'
import { TooManyRequest, TwitterApiError } from '../errors'
import type { Downloads } from 'webextension-polyfill'

export class FetchErrorNotificationUseCase {
  readonly tweetInfo: TweetInfo

  constructor(tweetInfo: TweetInfo) {
    this.tweetInfo = tweetInfo
  }

  notify(err: TwitterApiError): void {
    let notiConf = NotificationConfig.unknownFetchError(err.reason)
    if (err instanceof TooManyRequest) {
      notiConf = NotificationConfig.tooManyRequests(this.tweetInfo, err.reason)
    }

    chrome.notifications.create(makeFetchErrorNotificationId(this.tweetInfo.tweetId), notiConf)
  }
}

export class InternalErrorNotificationUseCase {
  readonly tweetInfo: TweetInfo

  constructor(tweetInfo: TweetInfo) {
    this.tweetInfo = tweetInfo
  }

  notify(err: Error) {
    const notiConf = NotificationConfig.internalError(err.message)
    chrome.notifications.create(makeFetchErrorNotificationId(this.tweetInfo.tweetId), notiConf)
  }
}

export class DownwloadFailedNotificationUseCase {
  readonly tweetInfo: TweetInfo

  constructor(tweetInfo: TweetInfo) {
    this.tweetInfo = tweetInfo
  }

  notify(downloadDelta: Downloads.OnChangedDownloadDeltaType): void {
    const notiConf = NotificationConfig.downloadError(this.tweetInfo, getDownloadDeltaEventTime(downloadDelta))

    chrome.notifications.create(makeDownloadFailedNotificationId(downloadDelta.id), notiConf)
  }
}

function getDownloadDeltaEventTime(downloadDelta: Downloads.OnChangedDownloadDeltaType) {
  const eventTime =
    !downloadDelta.error && 'current' in downloadDelta.endTime ? Date.parse(downloadDelta.endTime.current) : Date.now()

  return eventTime
}
