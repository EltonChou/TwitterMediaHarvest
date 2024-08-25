import InterruptReason from '#enums/InterruptReason'
import DownloadBaseEvent from './Download'

export default class DownloadInterrupted
  extends DownloadBaseEvent
  implements DownloadInterruptedEvent
{
  readonly reason: InterruptReason | string
  constructor(downloadId: number, reason: InterruptReason | string) {
    super('download:status:interrupted', downloadId)
    this.reason = reason
  }
}
