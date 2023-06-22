import type { DownloadDBSchema, DownloadRecordId } from '@schema'
import type { IDBPDatabase } from 'idb'
import type { Storage } from 'webextension-polyfill'
import DownloadRecord from './models'

export interface IDownloadRecordsRepository {
  getById(downloadItemId: number): Promise<DownloadRecord | null>
  save(downloadRecord: DownloadRecord): Promise<void>
  removeById(downloadItemId: number): Promise<void>
}

export class IndexedDBDownloadRecordsRepository implements IDownloadRecordsRepository {
  constructor(readonly clientProvider: Provider<IDBPDatabase<DownloadDBSchema>>) {}

  async save(downloadRecord: DownloadRecord): Promise<void> {
    const client = await this.clientProvider()
    await client.put('record', downloadRecord.toJson())
  }

  async getById(downloadItemId: number): Promise<DownloadRecord | null> {
    const client = await this.clientProvider()
    const record = await client.get('record', downloadItemId)
    return record ? DownloadRecord.fromJson(record) : null
  }

  async removeById(downloadItemId: number): Promise<void> {
    const client = await this.clientProvider()
    await client.delete('record', downloadItemId)
  }
}

export class StorageAreaDownloadRecordsRepository implements IDownloadRecordsRepository {
  constructor(readonly storageArea: Storage.StorageArea) {}

  async save(downloadRecord: DownloadRecord): Promise<void> {
    await this.storageArea.set({
      [createId(downloadRecord.id)]: downloadRecord.toJson(),
    })
  }

  async getById(downloadItemId: number): Promise<DownloadRecord | null> {
    const recordId = createId(downloadItemId)
    const volume = await this.storageArea.get(recordId)
    if (recordId in volume) {
      return DownloadRecord.fromJson(volume[recordId])
    }
    return null
  }

  async removeById(downloadItemId: number): Promise<void> {
    const recordId = createId(downloadItemId)
    await this.storageArea.remove(recordId)
  }
}

function createId(downloadItemId: number): DownloadRecordId {
  return `dl_${downloadItemId}`
}
