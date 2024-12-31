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
        if (!this.isDownlodedBySelfUseCase.process({ item: currItem })) return stats
        return stats.increase({
          downloadCount: 1,
          trafficUsage: Math.max(0, currItem.fileSize),
        })
      },
      new UsageStatistics({ downloadCount: 0, trafficUsage: 0 })
    )

    const originalStats = await this.usageStatisticsRepo.get()

    if (syncedStats.isGreaterThan(originalStats)) {
      await this.usageStatisticsRepo.save(syncedStats)
    }
  }
}
