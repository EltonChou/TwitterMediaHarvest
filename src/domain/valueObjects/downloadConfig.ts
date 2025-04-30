/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import type ConflictAction from '#enums/ConflictAction'
import { ValueObject } from './base'

type DownloadConfigProps = {
  url: string
  filename: string
  saveAs: boolean
  conflictAction: ConflictAction
}

export class DownloadConfig extends ValueObject<DownloadConfigProps> {}
