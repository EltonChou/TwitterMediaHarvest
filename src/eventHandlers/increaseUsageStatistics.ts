/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import type { DomainEventHandler } from '#domain/eventPublisher'
import type { IDownloadRepository } from '#domain/repositories/download'
import type { IUsageStatisticsRepository } from '#domain/repositories/usageStatistics'
import type { UsageStatistics } from '#domain/valueObjects/usageStatistics'

export const increaseUsageStatistics =
  (
    statsRepo: IUsageStatisticsRepository,
    downloadRepo: IDownloadRepository
  ): DomainEventHandler<DownloadEvent | IDomainEvent> =>
  async event => {
    let newStats: UsageStatistics

    const stats = await statsRepo.get()
    if (assertDownloadEvent(event)) {
      const item = await downloadRepo.getById(event.downloadId)
      newStats = stats.increase({
        downloadCount: 1,
        trafficUsage: item ? item.fileSize : 0,
      })
    } else {
      newStats = stats.increase({
        downloadCount: 1,
        trafficUsage: 0,
      })
    }

    await statsRepo.save(newStats)
  }

const assertDownloadEvent: Assert<IDomainEvent, DownloadEvent> = (
  event
): event is DownloadEvent => Object.hasOwn(event, 'downloadId')
