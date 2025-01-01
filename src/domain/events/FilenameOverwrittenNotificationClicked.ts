import { DomainEvent } from './base'

export class FilenameOverwrittenNotificationClicked extends DomainEvent {
  constructor() {
    super('notification:filenameOverwritten:self:clicked')
  }
}
