import DownloadBaseEvent from './Download'
import type { Downloads } from 'webextension-polyfill'

export default class DownloadCanceled extends DownloadBaseEvent {
  constructor(downloadDelta: Downloads.OnChangedDownloadDeltaType) {
    super('download:status:canceled', downloadDelta)
  }
}
