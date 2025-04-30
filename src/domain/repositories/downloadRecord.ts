/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import type { DownloadRecord } from '../valueObjects/downloadRecord'

export interface IDownloadRecordRepository {
  getById(downloadItemId: number): AsyncResult<DownloadRecord>
  save(downloadRecord: DownloadRecord): Promise<UnsafeTask>
  removeById(downloadItemId: number): Promise<UnsafeTask>
}

export class DownloadRecordNotFound extends Error {
  constructor(id: number) {
    super(`Download record not found. (id: ${id})`)
  }
}
