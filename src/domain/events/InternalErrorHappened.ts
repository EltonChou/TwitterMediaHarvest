/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { DomainEvent } from './base'

type Options = {
  isExplicit: boolean
}

export default class InternalErrorHappened
  extends DomainEvent
  implements InternalErrorEvent
{
  readonly reason: string
  readonly error: Error
  readonly isExplicit: boolean

  constructor(reason: string, error: Error, options?: Options) {
    super('runtime:error:internal')
    this.reason = reason
    this.error = error
    this.isExplicit = Boolean(options?.isExplicit)
  }
}
