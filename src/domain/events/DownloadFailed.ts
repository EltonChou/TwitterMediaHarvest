import InterruptReason from '#enums/InterruptReason'
import DownloadBaseEvent from './Download'
import type { Downloads } from 'webextension-polyfill'

export default class DownloadFailed
  extends DownloadBaseEvent
  implements DownloadFailedEvent
{
  readonly reason: InterruptReason
  constructor(downloadItem: Downloads.DownloadItem, reason: InterruptReason) {
    super('download:status:failed', downloadItem)
    this.reason = reason
  }
}
