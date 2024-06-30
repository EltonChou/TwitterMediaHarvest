import DownloadFailedNotificationInteracted from './DownloadFailedNotificationInteracted'

export default class DownloadFailedNotificationClicked extends DownloadFailedNotificationInteracted {
  constructor(downloadId: number) {
    super('notification:downloadFailed:self:clicked', downloadId)
  }
}
