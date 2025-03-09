import type { DownloadHistory } from '#domain/entities/downloadHistory'

export interface IPortableDownloadHistoryRepository {
  import(downloadHistories: DownloadHistory[]): Promise<UnsafeTask>
  export(): AsyncResult<Blob>
  export<T>(convertBlob: (blob: Blob) => Promise<T>): AsyncResult<T>
}
