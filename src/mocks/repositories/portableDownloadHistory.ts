import { DownloadHistory } from '#domain/entities/downloadHistory'
import type { IPortableDownloadHistoryRepository } from '#domain/repositories/portableDownloadHistory'

export class MockPortableDownloadHistoryRepo
  implements IPortableDownloadHistoryRepository
{
  import(_downloadHistories: DownloadHistory[]): Promise<UnsafeTask> {
    throw new Error('Method not implemented.')
  }
  export(): AsyncResult<string> {
    throw new Error('Method not implemented.')
  }
}
