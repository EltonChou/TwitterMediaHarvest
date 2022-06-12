import { getExtensionURL, i18nLocalize } from '../../libs/chromeApi'
import DownloadRecordUtil from '../utils/DownloadRecordUtil'

const templateType = Object.freeze({
  basic: 'basic',
  image: 'image',
  list: 'list',
  progress: 'progress',
})

const viewTwitterButton = (): chrome.notifications.ButtonOptions => {
  return {
    title: i18nLocalize('notificationDLFailedButton1'),
  }
}

const retryDownloadButton = (): chrome.notifications.ButtonOptions => {
  return {
    title: i18nLocalize('notificationDLFailedButton2'),
  }
}

const makeDownloadErrorNotificationConfig = (
  tweetInfo: TweetInfo,
  eventTime: number
): chrome.notifications.NotificationOptions => {
  const prevMsg = i18nLocalize('notificationDLFailedMessageFirst')
  const lastMsg = i18nLocalize('notificationDLFailedMessageLast')
  const message = `${prevMsg}${tweetInfo.screenName}(${tweetInfo.tweetId})${lastMsg}`

  return {
    type: templateType.basic,
    iconUrl: getExtensionURL('assets/icons/icon128.png'),
    title: i18nLocalize('notificationDLFailedTitle'),
    message: message,
    contextMessage: 'Media Harvest',
    buttons: [viewTwitterButton(), retryDownloadButton()],
    eventTime: eventTime,
    requireInteraction: true,
  }
}

const makeTooManyRequestsNotificationConfig = (
  tweetInfo: TweetInfo,
  { title, message }: FetchErrorReason
): chrome.notifications.NotificationOptions => {
  const prevMsg = i18nLocalize('notificationDLFailedMessageFirst')
  const lastMsg = i18nLocalize('notificationDLFailedMessageLast')
  const info = `${prevMsg}${tweetInfo.screenName}(${tweetInfo.tweetId})${lastMsg} ${message}`

  return {
    type: templateType.basic,
    iconUrl: getExtensionURL('assets/icons/icon128.png'),
    title: title,
    message: info,
    contextMessage: 'Media Harvest',
    buttons: [viewTwitterButton()],
    eventTime: Date.now(),
    requireInteraction: true,
    silent: false,
  }
}

const makeUnknownFetchErrorNotificationConfig = ({
  title,
  message,
}: FetchErrorReason): chrome.notifications.NotificationOptions => {
  return {
    type: templateType.basic,
    iconUrl: getExtensionURL('assets/icons/icon128.png'),
    title: title,
    message: message,
    contextMessage: 'Media Harvest',
    eventTime: Date.now(),
    requireInteraction: true,
    silent: false,
  }
}

export const notifyMediaListFetchError = (
  tweetInfo: TweetInfo,
  reason: FetchErrorReason
) => {
  const notiConf = makeTooManyRequestsNotificationConfig(tweetInfo, reason)

  chrome.notifications.create(tweetInfo.tweetId, notiConf)
}

export const notifyUnknownFetchError = (
  tweetInfo: TweetInfo,
  reason: FetchErrorReason
) => {
  const notiConf = makeUnknownFetchErrorNotificationConfig(reason)

  chrome.notifications.create(tweetInfo.tweetId, notiConf)
}

export const notifyDownloadFailed = (
  tweetInfo: TweetInfo,
  downloadId: number,
  downloadEndTime: number
) => {
  const notiConf = makeDownloadErrorNotificationConfig(
    tweetInfo,
    downloadEndTime
  )

  const downloadRecordId = DownloadRecordUtil.createId(downloadId)
  chrome.notifications.create(downloadRecordId, notiConf)
}
