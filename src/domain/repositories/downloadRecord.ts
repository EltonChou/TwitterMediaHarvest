import type { DownloadRecord } from '../valueObjects/downloadRecord'

export interface IDownloadRecordRepository {
  getById(downloadItemId: number): Promise<DownloadRecord | undefined>
  save(downloadRecord: DownloadRecord): Promise<void>
  removeById(downloadItemId: number): Promise<void>
  getAll(): Promise<DownloadRecord[]>
}
