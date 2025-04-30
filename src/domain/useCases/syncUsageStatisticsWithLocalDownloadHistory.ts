/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import type { IDownloadRepository } from '#domain/repositories/download'
import type { IUsageStatisticsRepository } from '#domain/repositories/usageStatistics'
import { UsageStatistics } from '#domain/valueObjects/usageStatistics'
import type { AsyncCommandUseCase } from './base'
import type { CheckDownloadWasTriggeredBySelf } from './checkDownloadWasTriggeredBySelf'

export class SyncUsageStatisticsWithLocalDownloadHistory
  implements AsyncCommandUseCase<void>
{
  constructor(
    readonly usageStatisticsRepo: IUsageStatisticsRepository,
    readonly downloadRepository: IDownloadRepository,
    readonly isDownlodedBySelfUseCase: CheckDownloadWasTriggeredBySelf
  ) {}

  async process(): Promise<void> {
    const pastItems = await this.downloadRepository.search({ limit: 0 })

    const syncedStats = pastItems.reduce(
      (stats, currItem) => {
        return this.isDownlodedBySelfUseCase.process({
          item: currItem,
          allowJSON: false,
        })
          ? stats.increase({
              downloadCount: 1,
              trafficUsage: Math.max(0, currItem.fileSize),
            })
          : stats
      },
      new UsageStatistics({ downloadCount: 0, trafficUsage: 0 })
    )

    const originalStats = await this.usageStatisticsRepo.get()

    if (syncedStats.isGreaterThan(originalStats)) {
      await this.usageStatisticsRepo.save(syncedStats)
    }
  }
}
