import InterruptReason from '#enums/InterruptReason'
import DownloadBaseEvent from './Download'

export default class DownloadInterrupted
  extends DownloadBaseEvent
  implements DownloadInterruptedEvent
{
  readonly reason: InterruptReason
  constructor(downloadId: number, reason: InterruptReason) {
    super('download:status:interrupted', downloadId)
    this.reason = reason
  }
}
