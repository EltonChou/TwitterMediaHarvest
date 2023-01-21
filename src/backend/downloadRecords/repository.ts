import DownloadRecord from './models'
import {
  BrowserStorageFetcher,
  BrowserStorageRemover,
  BrowserStorageSetter,
  storageFetcher,
  storageRemover,
  storageSetter
} from '../../libs/chromeApi'

export interface IDownloadRecordsRepository {
  getById(downloadItemId: number): Promise<DownloadRecord | null>
  save(downloadRecord: DownloadRecord): Promise<void>
  removeById(downloadItemId: number): Promise<void>
}


export class StorageAreaDownloadRecordsRepository implements IDownloadRecordsRepository {
  readonly setStorage: BrowserStorageSetter
  readonly fetchStorage: BrowserStorageFetcher
  readonly removeFromStorage: BrowserStorageRemover

  constructor(storageArea: chrome.storage.StorageArea) {
    this.setStorage = storageSetter(storageArea)
    this.fetchStorage = storageFetcher(storageArea)
    this.removeFromStorage = storageRemover(storageArea)
  }

  async save(downloadRecord: DownloadRecord): Promise<void> {
    await this.setStorage({
      [createId(downloadRecord.id)]: downloadRecord.toJson()
    })
  }

  async getById(downloadItemId: number): Promise<DownloadRecord | null> {
    const recordId = createId(downloadItemId)
    const volume = await this.fetchStorage(recordId)
    if (recordId in volume) {
      return DownloadRecord.fromJson(volume[recordId])
    }
    return null
  }

  async removeById(downloadItemId: number): Promise<void> {
    const recordId = createId(downloadItemId)
    await this.removeFromStorage(recordId)
  }
}

function createId(downloadItemId: number): DownloadRecordId {
  return `dl_${downloadItemId}`
}

