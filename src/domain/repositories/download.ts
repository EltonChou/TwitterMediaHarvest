/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
export type DownloadQuery = {
  id?: number
  limit?: number
}

export type DownloadItem = {
  id: number
  filename: string
  fileSize: number
  url: string
  byExtensionId?: string
  mime?: string
}

export interface IDownloadRepository<
  Query = DownloadQuery,
  Item = DownloadItem,
> {
  getById(id: number): Promise<Item | undefined>
  search(query: Query): Promise<Item[]>
}
