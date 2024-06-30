import DownloadFailedNotificationInteracted from './DownloadFailedNotificationInteracted'

export default class DownloadFailedNotificationClosed extends DownloadFailedNotificationInteracted {
  constructor(downloadId: number) {
    super('notification:downloadFailed:self:closed', downloadId)
  }
}
