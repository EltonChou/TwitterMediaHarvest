/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import type { DomainEventHandler } from '#domain/eventPublisher'
import type { IDownloadRecordRepository } from '#domain/repositories/downloadRecord'
import { DownloadRecord } from '#domain/valueObjects/downloadRecord'

export const recordDispatchedDownloadConfiguration =
  (
    downloadRecordRepo: IDownloadRecordRepository
  ): DomainEventHandler<BrowserDownloadDispatchedEvent> =>
  async event => {
    const record = new DownloadRecord({
      downloadId: event.downloadId,
      recordedAt: event.occuredAt,
      tweetInfo: event.tweetInfo,
      downloadConfig: event.downloadConfig,
    })

    await downloadRecordRepo.save(record)
  }
