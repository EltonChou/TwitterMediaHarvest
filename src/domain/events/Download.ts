import { DomainEvent } from './base'
import type { Downloads } from 'webextension-polyfill'

export default abstract class DownloadBaseEvent
  extends DomainEvent
  implements DownloadItemEvent
{
  readonly downloadItem: Downloads.DownloadItem

  constructor(name: DownloadItemEvent['name'], downloadItem: Downloads.DownloadItem) {
    super(name)
    this.downloadItem = downloadItem
  }
}
