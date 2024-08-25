import DownloadBaseEvent from './Download'

export default class DownloadInterrupted
  extends DownloadBaseEvent
  implements DownloadInterruptedEvent
{
  readonly reason: string
  constructor(downloadId: number, reason: string) {
    super('download:status:interrupted', downloadId)
    this.reason = reason
  }
}
