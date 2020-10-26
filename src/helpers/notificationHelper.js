import { i18nLocalize, getExtensionURL } from '../libs/chromeApi'

const templateType = Object.freeze({
  basic: 'basic',
  image: 'image',
  list: 'list',
  progress: 'progress',
})

/**
 * @returns {chrome.notifications.ButtonOptions}
 */
const viewTwitterButton = () => {
  return {
    title: i18nLocalize('notificationDLFailedButton1'),
  }
}

/**
 * @returns {chrome.notifications.ButtonOptions}
 */
const retryDownloadButton = () => {
  return {
    title: i18nLocalize('notificationDLFailedButton2'),
  }
}

/**
 * @returns {chrome.notifications.NotificationOptions}
 */
const makeDownloadErrorNotificationConfig = (tweetInfo, eventTime) => {
  if (typeof eventTime === 'string') eventTime = Date.parse(eventTime)
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

/**
 * @param {import('../utils/parser').tweetInfo} tweetInfo
 * @param {import('../libs/MediaTweet').fetchErrorReason} param1
 * @returns {chrome.notifications.NotificationOptions}
 */
const makeTooManyRequestsNotificationConfig = (
  tweetInfo,
  { title, message }
) => {
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

const makeUnknownFetchErrorNotificationConfig = ({ title, message }) => {
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

export const notifyMediaListFetchError = (tweetInfo, reason) => {
  const notiConf = makeTooManyRequestsNotificationConfig(tweetInfo, reason)

  chrome.notifications.create(tweetInfo.tweetId, notiConf)
}

export const notifyUnknownFetchError = (tweetInfo, reason) => {
  const notiConf = makeUnknownFetchErrorNotificationConfig(reason)

  chrome.notifications.create(tweetInfo.tweetId, notiConf)
}

/**
 *
 * @param {import('../utils/parser').tweetInfo} tweetInfo
 * @param {number} downloadId
 * @param {number} downloadEndTime
 */
export const notifyDownloadFailed = (
  tweetInfo,
  downloadId,
  downloadEndTime
) => {
  const eventTime = Date.parse(downloadEndTime)
  const notiConf = makeDownloadErrorNotificationConfig(tweetInfo, eventTime)

  chrome.notifications.create(String(downloadId), notiConf)
}
