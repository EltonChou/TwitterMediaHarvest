import type { DomainEventHandler } from '#domain/eventPublisher'
import type { IDownloadRecordRepository } from '#domain/repositories/downloadRecord'

/**
 * CAUTION: this handler will remove the download record.
 */
export const cleanDownloadRecord =
  (
    downloadRecordRepo: IDownloadRecordRepository
  ): DomainEventHandler<DownloadEvent | DownloadFailedNotificationEvent> =>
  async event => {
    await downloadRecordRepo.removeById(event.downloadId)
  }
