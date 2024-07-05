import type { IDownloadRecordRepository } from '#domain/repositories/downloadRecord'
import { DownloadRecord } from '#domain/valueObjects/downloadRecord'

export class MockDownloadRecordRepo implements IDownloadRecordRepository {
  getById(downloadItemId: number): Promise<DownloadRecord | null> {
    throw new Error('Method not implemented.')
  }
  save(downloadRecord: DownloadRecord): Promise<void> {
    throw new Error('Method not implemented.')
  }
  removeById(downloadItemId: number): Promise<void> {
    throw new Error('Method not implemented.')
  }
  getAll(): Promise<DownloadRecord[]> {
    throw new Error('Method not implemented.')
  }
}
