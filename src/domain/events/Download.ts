import { DomainEvent } from './base'
import type { Downloads } from 'webextension-polyfill'

export default abstract class DownloadDeltaBaseEvent
  extends DomainEvent
  implements DownloadDeltaEvent
{
  readonly downloadDelta: Downloads.OnChangedDownloadDeltaType

  constructor(
    name: DownloadDeltaBaseEvent['name'],
    downloadDelta: Downloads.OnChangedDownloadDeltaType
  ) {
    super(name)
    this.downloadDelta = downloadDelta
  }
}
