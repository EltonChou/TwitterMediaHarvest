import { DomainEvent } from './base'
import type { Downloads } from 'webextension-polyfill'

export default abstract class DownloadFailedNotificationInteracted extends DomainEvent {
  readonly downloadId: Downloads.DownloadItem['id']

  constructor(downloadId: Downloads.DownloadItem['id']) {
    super()
    this.downloadId = downloadId
  }
}
