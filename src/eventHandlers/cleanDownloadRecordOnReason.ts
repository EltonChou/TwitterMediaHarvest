// SPDX-License-Identifier: MPL-2.0
import type { DomainEventHandler } from '#domain/eventPublisher'
import type { IDownloadRecordRepository } from '#domain/repositories/downloadRecord'

/**
 * Removes the download record when the interruption reason matches one of the
 * provided reasons. Used to clean up records for paths that are not handled by
 * the standard `notification:downloadFailed:self:closed` cleanup.
 */
export const cleanDownloadRecordOnReason =
  (
    downloadRecordRepo: IDownloadRecordRepository,
    reasons: ReadonlyArray<string>
  ): DomainEventHandler<DownloadInterruptedEvent> =>
  async event => {
    if (!reasons.includes(event.reason)) return
    await downloadRecordRepo.removeById(event.downloadId)
  }
