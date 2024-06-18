import { DomainEvent } from './base'
import type { Downloads } from 'webextension-polyfill'

export default abstract class DownloadBaseEvent
  extends DomainEvent
  implements DownloadEvent
{
  readonly downloadItem: Downloads.DownloadItem

  constructor(name: DownloadEvent['name'], downloadItem: Downloads.DownloadItem) {
    super(name)
    this.downloadItem = downloadItem
  }
}
