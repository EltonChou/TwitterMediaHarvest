/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import DownloadBaseEvent from './Download'

export default class DownloadInterrupted
  extends DownloadBaseEvent
  implements DownloadInterruptedEvent
{
  readonly reason: string
  constructor(downloadId: number, reason: string) {
    super('download:status:interrupted', downloadId)
    this.reason = reason
  }
}
