import { DownloadHistory } from '#domain/entities/downloadHistory'
import type { IPortableDownloadHistoryRepository } from '#domain/repositories/portableDownloadHistory'

export class MockPortableDownloadHistoryRepo
  implements IPortableDownloadHistoryRepository
{
  export(): AsyncResult<Blob>
  export<T>(convertBlob: (blob: Blob) => Promise<T>): AsyncResult<T>
  export<T>(
    _convertBlob?: (blob: Blob) => Promise<T>
  ): AsyncResult<Blob, Error> | AsyncResult<T, Error> {
    throw new Error('Method not implemented.')
  }
  import(_downloadHistories: DownloadHistory[]): Promise<UnsafeTask> {
    throw new Error('Method not implemented.')
  }
}
