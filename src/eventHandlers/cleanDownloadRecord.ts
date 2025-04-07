/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
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
