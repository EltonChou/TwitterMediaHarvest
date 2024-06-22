import { DomainEvent } from './base'

type VersionDelta = {
  current: string
  previous: string
}

export default class RuntimeUpdated extends DomainEvent {
  private versionDelta: VersionDelta

  constructor(versionDelta: VersionDelta) {
    super('runtime:status:updated')
    this.versionDelta = versionDelta
  }

  get currentVersion() {
    return this.versionDelta.current
  }

  get previousVersion() {
    return this.versionDelta.previous
  }
}
