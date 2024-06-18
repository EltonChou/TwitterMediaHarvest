import { DomainEvent } from './base'

export default class ExtensionInstalled extends DomainEvent {
  name = 'extension:installed'
}
