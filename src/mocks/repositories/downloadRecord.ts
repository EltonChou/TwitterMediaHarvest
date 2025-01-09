import type { IDownloadRecordRepository } from '#domain/repositories/downloadRecord'
import { DownloadRecord } from '#domain/valueObjects/downloadRecord'

export class MockDownloadRecordRepo implements IDownloadRecordRepository {
  getById(_downloadItemId: number): AsyncResult<DownloadRecord> {
    throw new Error('Method not implemented.')
  }
  save(_downloadRecord: DownloadRecord): Promise<UnsafeTask> {
    throw new Error('Method not implemented.')
  }
  removeById(_downloadItemId: number): Promise<UnsafeTask> {
    throw new Error('Method not implemented.')
  }
}
