import type { IDownloadRecordRepository } from '#domain/repositories/downloadRecord'
import { DownloadRecord } from '#domain/valueObjects/downloadRecord'

export class MockDownloadRecordRepo implements IDownloadRecordRepository {
  getById(downloadItemId: number): AsyncResult<DownloadRecord> {
    throw new Error('Method not implemented.')
  }
  save(downloadRecord: DownloadRecord): Promise<UnsafeTask> {
    throw new Error('Method not implemented.')
  }
  removeById(downloadItemId: number): Promise<UnsafeTask> {
    throw new Error('Method not implemented.')
  }
}
