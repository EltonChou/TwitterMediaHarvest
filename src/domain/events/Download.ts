import { DomainEvent } from './base'

export default abstract class DownloadBaseEvent
  extends DomainEvent
  implements DownloadEvent
{
  readonly downloadId: number

  constructor(name: DownloadEvent['name'], downloadId: number) {
    super(name)
    this.downloadId = downloadId
  }
}
