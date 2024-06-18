import { DomainEvent } from './base'

export default class RuntimeInstalled extends DomainEvent {
  constructor() {
    super('runtime:installed')
  }
}
