/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import type {
  DownloadItem,
  DownloadQuery,
  IDownloadRepository,
} from '#domain/repositories/download'
import { downloads } from 'webextension-polyfill'

export class BrowserDownloadRepository implements IDownloadRepository {
  async getById(id: number): Promise<DownloadItem | undefined> {
    const [item] = await downloads.search({ id: id })
    return item
  }
  async search(query: DownloadQuery): Promise<DownloadItem[]> {
    return downloads.search(query)
  }
}
