import DownloadBaseEvent from './Download'
import type { Downloads } from 'webextension-polyfill'

export default class DownloadCanceled extends DownloadBaseEvent {
  constructor(downloadItem: Downloads.DownloadItem) {
    super('download:status:canceled', downloadItem)
  }
}
