import DownloadFailedNotificationInteracted from './DownloadFailedNotificationInteracted'
import type { Downloads } from 'webextension-polyfill'

export default class DownloadFailedNotificationRetryButtonClicked extends DownloadFailedNotificationInteracted {
  constructor(downloadId: Downloads.DownloadItem['id']) {
    super('notification:downloadFailed:retryButton:clicked', downloadId)
  }
}
