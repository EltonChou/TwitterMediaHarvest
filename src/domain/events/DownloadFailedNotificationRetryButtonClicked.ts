import DownloadFailedNotificationInteracted from './DownloadFailedNotificationInteracted'

export default class DownloadFailedNotificationRetryButtonClicked extends DownloadFailedNotificationInteracted {
  constructor(downloadId: number) {
    super('notification:downloadFailed:retryButton:clicked', downloadId)
  }
}
