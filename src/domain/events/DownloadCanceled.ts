import { DomainEvent } from './base'
import type { Downloads } from 'webextension-polyfill'

export default class DownloadCanceled extends DomainEvent {
  name = 'download:canceled'
  private downloadItem: Downloads.DownloadItem

  constructor(downloadItem: Downloads.DownloadItem) {
    super()
    this.downloadItem = downloadItem
  }

  get downloadId() {
    return this.downloadItem.id
  }
}
