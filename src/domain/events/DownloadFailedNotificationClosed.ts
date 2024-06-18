import DownloadFailedNotificationInteracted from './DownloadFailedNotificationInteracted'
import type { Downloads } from 'webextension-polyfill'

export default class DownloadFailedNotificationClosed extends DownloadFailedNotificationInteracted {
  constructor(downloadId: Downloads.DownloadItem['id']) {
    super('notification:downloadFailed:self:closed', downloadId)
  }
}
