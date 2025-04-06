/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { DomainEvent } from './base'

export default class RuntimeInstalled
  extends DomainEvent
  implements RuntimeInstallEvent
{
  readonly version: string
  constructor(version: string) {
    super('runtime:status:installed')
    this.version = version
  }
}
