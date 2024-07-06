import type { DomainEventHandler } from '#domain/eventPublisher'
import DownloadFailedNotificationClosed from '#domain/events/DownloadFailedNotificationClosed'
import type { IDownloadRecordRepository } from '#domain/repositories/downloadRecord'

/**
 * CAUTION: this handler will remove the download record.
 */
export const cleanDownloadRecord =
  (
    downloadRecordRepo: IDownloadRecordRepository
  ): DomainEventHandler<DownloadEvent | DownloadFailedNotificationClosed> =>
  async event => {
    await downloadRecordRepo.removeById(event.downloadId)
  }
