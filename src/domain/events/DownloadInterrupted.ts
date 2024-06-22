import InterruptReason from '#enums/InterruptReason'
import DownloadBaseEvent from './Download'
import type { Downloads } from 'webextension-polyfill'

export default class DownloadInterrupted
  extends DownloadBaseEvent
  implements DownloadInterruptedEvent
{
  readonly reason: InterruptReason
  constructor(
    downloadDelta: Downloads.OnChangedDownloadDeltaType,
    reason: InterruptReason
  ) {
    super('download:status:interrupted', downloadDelta)
    this.reason = reason
  }
}
