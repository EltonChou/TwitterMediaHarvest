import { DomainEvent } from './base'

export default class FilenameOverwritten extends DomainEvent {
  constructor() {
    super('filename:overwritten')
  }
}
