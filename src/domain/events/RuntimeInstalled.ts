import { DomainEvent } from './base'

export default class RuntimeInstalled extends DomainEvent implements RuntimeInstallEvent {
  readonly version: string
  constructor(version: string) {
    super('runtime:status:installed')
    this.version = version
  }
}
