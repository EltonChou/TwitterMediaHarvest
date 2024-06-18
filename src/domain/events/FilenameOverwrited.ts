import { DomainEvent } from './base'

export default class FilenameWasOverwritten extends DomainEvent {
  name = 'filename:overwritten'
}
