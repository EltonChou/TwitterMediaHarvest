import DownloadBaseEvent from './Download'
import type { Downloads } from 'webextension-polyfill'

export default class DownloadCompleted extends DownloadBaseEvent {
  constructor(downloadDelta: Downloads.OnChangedDownloadDeltaType) {
    super('download:status:completed', downloadDelta)
  }
}
