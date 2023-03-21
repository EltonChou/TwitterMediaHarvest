import DownloadRecord from './models'
import type { Storage } from 'webextension-polyfill'

export interface IDownloadRecordsRepository {
  getById(downloadItemId: number): Promise<DownloadRecord | null>
  save(downloadRecord: DownloadRecord): Promise<void>
  removeById(downloadItemId: number): Promise<void>
}

export class StorageAreaDownloadRecordsRepository implements IDownloadRecordsRepository {
  readonly storageArea: Storage.StorageArea

  constructor(storageArea: Storage.StorageArea) {
    this.storageArea = storageArea
  }

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
