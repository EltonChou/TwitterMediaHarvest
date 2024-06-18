import { DomainEvent } from './base'
import type { Downloads } from 'webextension-polyfill'

export default class DownloadCompleted extends DomainEvent {
  name = 'download:completed'
  private downloadItem: Downloads.DownloadItem

  constructor(downloadItem: Downloads.DownloadItem) {
    super()
    this.downloadItem = downloadItem
  }

  get downloadId() {
    return this.downloadItem.id
  }

  get fileSize() {
    return this.downloadItem.fileSize
  }
}
