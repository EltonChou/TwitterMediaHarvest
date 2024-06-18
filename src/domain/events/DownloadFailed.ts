import InterruptReason from '#enums/InterruptReason'
import { DomainEvent } from './base'
import type { Downloads } from 'webextension-polyfill'

export default class DownloadFailed extends DomainEvent {
  name = 'download:failed'

  private downloadItem: Downloads.DownloadItem
  readonly code: InterruptReason

  constructor(downloadItem: Downloads.DownloadItem, code: InterruptReason) {
    super()
    this.downloadItem = downloadItem
    this.code = code
  }

  get downloadId() {
    return this.downloadItem.id
  }
}
