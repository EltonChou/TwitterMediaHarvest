import type { DownloadHistory } from '#domain/entities/downloadHistory'

export interface IPortableDownloadHistoryRepository {
  import(downloadHistories: DownloadHistory[]): Promise<UnsafeTask>
  /**
   * @returns The value is url of exported file.
   */
  export(): AsyncResult<string>
}
