import { DomainEvent } from './base'

export default class ClientWasSynced extends DomainEvent {
  constructor() {
    super('client:synced')
  }
}
