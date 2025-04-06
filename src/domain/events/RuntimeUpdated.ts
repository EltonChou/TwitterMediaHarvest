/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
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
