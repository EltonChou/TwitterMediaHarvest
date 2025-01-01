import { DomainEvent } from './base'

export class FilenameOverwrittenNotificationIgnoreButtonClicked extends DomainEvent {
  constructor() {
    super('notification:filenameOverwritten:ignoreButton:clicked')
  }
}
