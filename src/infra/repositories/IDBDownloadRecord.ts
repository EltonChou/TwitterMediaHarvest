/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import type { Factory } from '#domain/factories/base'
import type { IDownloadRecordRepository } from '#domain/repositories/downloadRecord'
import { DownloadRecordNotFound } from '#domain/repositories/downloadRecord'
import { DownloadConfig } from '#domain/valueObjects/downloadConfig'
import { DownloadRecord } from '#domain/valueObjects/downloadRecord'
import { TweetInfo } from '#domain/valueObjects/tweetInfo'
import type { DownloadIDB } from '#libs/idb/download/db'
import type {
  DownloadDBSchema,
  DownloadRecordItem,
} from '#libs/idb/download/schema'
import { toErrorResult, toSuccessResult } from '#utils/result'
import { toError } from 'fp-ts/lib/Either'
import type { IDBPDatabase } from 'idb'

export class IDBDownloadRecordRepository implements IDownloadRecordRepository {
  constructor(readonly idb: DownloadIDB) {}

  async getById(downloadItemId: number): AsyncResult<DownloadRecord> {
    const { value: client, error: clientError } = await this.connect()
    if (clientError) return toErrorResult(clientError)

    try {
      const item = await client.get('record', IDBKeyRange.only(downloadItemId))
      if (!item)
        return toErrorResult(new DownloadRecordNotFound(downloadItemId))
      return toSuccessResult(itemToDownloadRecord(item))
    } catch (error) {
      return toErrorResult(toError(error))
    }
  }

  async save(downloadRecord: DownloadRecord): Promise<UnsafeTask> {
    const { value: client, error: clientError } = await this.connect()
    if (clientError) return clientError

    try {
      await client.put('record', downloadRecordToItem(downloadRecord))
    } catch (error) {
      return toError(error)
    }
  }

  async removeById(downloadItemId: number): Promise<UnsafeTask> {
    const { value: client, error: clientError } = await this.connect()
    if (clientError) return clientError

    try {
      await client.delete('record', IDBKeyRange.only(downloadItemId))
    } catch (error) {
      return toError(error)
    }
  }

  private async connect(): AsyncResult<IDBPDatabase<DownloadDBSchema>> {
    try {
      const client = await this.idb.connect()
      return toSuccessResult(client)
    } catch (error) {
      return toErrorResult(toError(error))
    }
  }
}

const itemToDownloadRecord: Factory<
  DownloadRecordItem,
  DownloadRecord
> = item =>
  new DownloadRecord({
    downloadConfig: new DownloadConfig({
      conflictAction: item.conflictAction,
      filename: item.filename,
      saveAs: item.saveAs,
      url: item.url,
    }),
    downloadId: item.id,
    tweetInfo: new TweetInfo(item.tweetInfo),
    recordedAt: new Date(item.recordedAt),
  })

const downloadRecordToItem: Factory<
  DownloadRecord,
  DownloadRecordItem
> = record =>
  record.mapBy(props => ({
    id: props.downloadId,
    recordedAt: props.recordedAt.getTime(),
    tweetInfo: props.tweetInfo.mapBy(props => props),
    ...props.downloadConfig.mapBy(props => props),
  }))
