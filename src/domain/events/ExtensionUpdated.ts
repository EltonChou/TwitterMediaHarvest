import { DomainEvent } from './base'

type VersionDelta = {
  current: string
  previous: string
}

export default class ExtensionUpdated extends DomainEvent {
  name = 'extension:updated'
  private versionDelta: VersionDelta

  constructor(versionDelta: VersionDelta) {
    super()
    this.versionDelta = versionDelta
  }

  get currentVersion() {
    return this.versionDelta.current
  }

  get previousVersion() {
    return this.versionDelta.previous
  }
}
