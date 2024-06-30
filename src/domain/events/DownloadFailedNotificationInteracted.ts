import { DomainEvent } from './base'

export default abstract class DownloadFailedNotificationInteracted
  extends DomainEvent
  implements DownloadFailedNotificationEvent
{
  readonly downloadId: number

  constructor(name: DomainEvent['name'], downloadId: number) {
    super(name)
    this.downloadId = downloadId
  }
}
