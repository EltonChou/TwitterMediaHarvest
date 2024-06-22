import type { DomainEventHandler } from '#domain/eventPublisher'
import type { IDownloadRecordRepository } from '#domain/repositories/downloadRecord'
import { DownloadRecord } from '#domain/valueObjects/downloadRecord'

export const recordDispatchedDownloadConfiguration =
  (
    downloadRecordRepo: IDownloadRecordRepository
  ): DomainEventHandler<BrowserDownloadDispatchEvent> =>
  async event => {
    const record = new DownloadRecord({
      downloadId: event.downloadId,
      recordedAt: event.occuredAt,
      tweetInfo: event.tweetInfo,
      downloadConfig: event.downloadConfig,
    })

    await downloadRecordRepo.save(record)
  }
