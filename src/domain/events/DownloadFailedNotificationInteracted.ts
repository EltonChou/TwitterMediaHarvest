import { DomainEvent } from './base'
import type { Downloads } from 'webextension-polyfill'

export default abstract class DownloadFailedNotificationInteracted
  extends DomainEvent
  implements DownloadFailedNotificationEvent
{
  readonly downloadId: Downloads.DownloadItem['id']

  constructor(name: DomainEvent['name'], downloadId: Downloads.DownloadItem['id']) {
    super(name)
    this.downloadId = downloadId
  }
}
