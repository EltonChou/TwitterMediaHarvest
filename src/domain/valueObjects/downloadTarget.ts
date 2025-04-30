/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { ValueObject } from './base'

type DownloadTargetProps = {
  url: string
  filename: string
}

export class DownloadTarget extends ValueObject<DownloadTargetProps> {}
