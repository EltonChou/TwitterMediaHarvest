import { i18nLocalize, getURL } from '../lib/chromeApi'

/**
 * @typedef TemplateType
 * @type {Enumerator<'basic' | 'image' | 'list' | 'progress'>}
 *
 * @typedef BrowserNotificationButton
 * @type {Object}
 * @property {string} title
 * @property {string} [iconUrl]
 *
 * @typedef BrowserNotificationItem
 * @type {Object}
 * @property {string} title
 * @property {string} message
 *
 * @typedef BrowserNotificationOptions
 * @type {Object}
 * @property {TemplateType} [type]
 * @property {string} [iconUrl] - A URL to the sender's avatar, app icon, or a thumbnail for image notifications.
 * - URLs can be a data URL, a blob URL, or a URL relative to a resource within this extension's .crx file.
 * - *Required for **notifications.create** method*.
 * @property {string} [title] - Title of the notification (e.g. sender name for email).
 * - *Required for **notifications.create** method*.
 * @property {string} [message] - Main notification content.
 * - *Required for **notifications.create** method*.
 * @property {string} [contextMessage] - Alternate notification content with a lower-weight font.
 * @property {number} [priority] - Priority ranges from -2 to 2. -2 is lowest priority. 2 is highest. Zero is default.
 * - On platforms that don't support a notification center (Windows, Linux & Mac), -2 and -1 result in an error as notifications with those priorities will not be shown at all.
 * @property {number} [eventTime] - A timestamp associated with the notification, in milliseconds past the epoch.
 * @property {Array<BrowserNotificationButton>} [buttons]
 * @property {Array<BrowserNotificationItem>} [items]
 * @property {number} [progress] - Current progress ranges from 0 to 100.
 * @property {boolean} [requireInteraction] - Indicates that the notification should remain visible on screen until the user activates or dismisses the notification. This defaults to false.
 * @property {boolean} [silent] - Indicates that no sounds or vibrations should be made when the notification is being shown. This defaults to false.
 */

/**
 * @type {TemplateType}
 */
const templateType = Object.freeze({
  basic: 'basic',
  image: 'image',
  list: 'list',
  progress: 'progress',
})

/**
 * @returns {BrowserNotificationButton}
 */
const viewTwitterButton = () => {
  return {
    title: i18nLocalize('notificationDLFailedButton1'),
  }
}

/**
 * @returns {BrowserNotificationButton}
 */
const retryDownloadButton = () => {
  return {
    title: i18nLocalize('notificationDLFailedButton2'),
  }
}

/**
 * @param {string} tweetId
 * @param { Date } eventTime - allow ISO 8601 format date string
 * @returns {BrowserNotificationOptions}
 */
export const makeDownloadErrorNotificationConfig = (tweetId, eventTime) => {
  if (typeof eventTime === 'string') eventTime = Date.parse(eventTime)
  const prevMsg = i18nLocalize('notificationDLFailedMessageFirst')
  const lastMsg = i18nLocalize('notificationDLFailedMessageLast')
  const message = `${prevMsg}twitter(${tweetId})${lastMsg}`

  return {
    type: templateType.basic,
    iconUrl: getURL('assets/icons/icon128.png'),
    title: i18nLocalize('notificationDLFailedTitle'),
    message: message,
    contextMessage: 'Media Harvest',
    buttons: [viewTwitterButton(), retryDownloadButton()],
    eventTime: eventTime,
    requireInteraction: true,
  }
}

export const notifyDownloadFailed = async (
  tweetId,
  downloadId,
  downloadEndTime
) => {
  const eventTime = Date.parse(downloadEndTime)
  const notiConf = makeDownloadErrorNotificationConfig(tweetId, eventTime)

  chrome.notifications.create(String(downloadId), notiConf)
}
