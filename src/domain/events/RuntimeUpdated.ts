import { DomainEvent } from './base'

type VersionDelta = {
  current: string
  previous: string
}

export default class RuntimeUpdated
  extends DomainEvent
  implements RuntimeUpdateEvent
{
  readonly currentVersion: string
  readonly previousVersion: string

  constructor(versionDelta: VersionDelta) {
    super('runtime:status:updated')
    this.currentVersion = versionDelta.current
    this.previousVersion = versionDelta.previous
  }
}
