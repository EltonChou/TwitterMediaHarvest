import DownloadFailedNotificationInteracted from './DownloadFailedNotificationInteracted'

export default class DownloadFailedNotificationViewButtonClicked extends DownloadFailedNotificationInteracted {
  constructor(downloadId: number) {
    super('notification:downloadFailed:viewButton:clicked', downloadId)
  }
}
