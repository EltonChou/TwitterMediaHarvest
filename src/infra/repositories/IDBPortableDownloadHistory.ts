/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { DownloadHistory } from '#domain/entities/downloadHistory'
import type { IPortableDownloadHistoryRepository } from '#domain/repositories/portableDownloadHistory'
import { V5PortableHistory } from '#domain/valueObjects/portableDownloadHistory'
import { DownloadIDB } from '#libs/idb/download/db'
import { toErrorResult, toSuccessResult } from '#utils/result'
import {
  downloadHistoryDBItemToProtableHistoryItem,
  downloadHistoryToIDBItem,
} from '../../mappers/downloadHistory'
import { toError } from 'fp-ts/lib/Either'

export class IDBPortableDownloadHistoryRepository
  implements IPortableDownloadHistoryRepository
{
  constructor(readonly downloadIDB: DownloadIDB) {}

  export(): AsyncResult<Blob>
  export<T>(convertBlob: (blob: Blob) => Promise<T>): AsyncResult<T>
  async export<T>(convertBlob?: (blob: Blob) => Promise<T>) {
    try {
      const { tx } = await this.downloadIDB.prepareTransaction(
        'history',
        'readonly'
      )

      const items = await tx.objectStore('history').getAll()

      const protableDownloadHistory = new V5PortableHistory({
        items: items.map(downloadHistoryDBItemToProtableHistoryItem),
      })

      const blob = new Blob([JSON.stringify(protableDownloadHistory)], {
        type: 'application/json',
      })

      return toSuccessResult(convertBlob ? await convertBlob(blob) : blob)
    } catch (error) {
      return toErrorResult(toError(error))
    }
  }

  async import(downloadHistories: DownloadHistory[]): Promise<UnsafeTask> {
    let context
    try {
      context = await this.downloadIDB.prepareTransaction(
        ['hashtag', 'history'],
        'readwrite'
      )

      const historyStore = context.tx.objectStore('history')
      const hashtagStore = context.tx.objectStore('hashtag')

      const hashtagRecord: Record<string, Set<string>> = {}

      for (const downloadHistory of downloadHistories) {
        await historyStore.put(downloadHistoryToIDBItem(downloadHistory))

        for (const hashtag of downloadHistory.mapBy(
          (_, props) => props.hashtags
        )) {
          if (hashtag in hashtagRecord) {
            hashtagRecord[hashtag].add(downloadHistory.id.value)
          } else {
            hashtagRecord[hashtag] = new Set([downloadHistory.id.value])
          }
        }
      }

      for (const [hashtag, ids] of Object.entries(hashtagRecord)) {
        const item = await hashtagStore.get(IDBKeyRange.only(hashtag))

        await hashtagStore.put({
          name: hashtag,
          tweetIds: item
            ? new Set([...ids, ...Array.from(item.tweetIds)])
            : new Set(ids),
        })
      }

      await context.completeTx()
    } catch (error) {
      await context?.abortTx()
      return toError(error)
    }
  }
}
