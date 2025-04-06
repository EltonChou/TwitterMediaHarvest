/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { DomainEvent } from './base'

export default class FilenameIsOverwritten
  extends DomainEvent
  implements FilenameOverwrittenEvent
{
  readonly expectedName: string
  readonly finalName: string

  constructor(expectedName: string, finalName: string) {
    super('filename:overwritten')
    this.expectedName = expectedName
    this.finalName = finalName
  }
}
