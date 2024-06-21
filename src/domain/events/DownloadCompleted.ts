import DownloadBaseEvent from './Download'
import type { Downloads } from 'webextension-polyfill'

export default class DownloadCompleted extends DownloadBaseEvent {
  constructor(downloadItem: Downloads.DownloadItem) {
    super('download:status:completed', downloadItem)
  }
}
