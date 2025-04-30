/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import type { DownloadHistory } from '#domain/entities/downloadHistory'

export interface IPortableDownloadHistoryRepository {
  import(downloadHistories: DownloadHistory[]): Promise<UnsafeTask>
  export(): AsyncResult<Blob>
  export<T>(convertBlob: (blob: Blob) => Promise<T>): AsyncResult<T>
}
