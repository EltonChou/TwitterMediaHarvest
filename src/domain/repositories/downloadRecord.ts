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
