import DownloadFailedNotificationInteracted from './DownloadFailedNotificationInteracted'
import type { Downloads } from 'webextension-polyfill'

export default class DownloadFailedNotificationViewButtonClicked extends DownloadFailedNotificationInteracted {
  constructor(downloadId: Downloads.DownloadItem['id']) {
    super('notification:downloadFailed:viewButton:clicked', downloadId)
  }
}
