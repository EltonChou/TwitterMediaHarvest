import type { IDownloadRepository } from '#domain/repositories/download'
import type { IUsageStatisticsRepository } from '#domain/repositories/usageStatistics'
import { UsageStatics } from '#domain/valueObjects/usageStatistics'
import type { AsyncCommandUseCase } from './base'

export class SyncUsageStatisticsWithLocalDownloadHistory
  implements AsyncCommandUseCase<void>
{
  constructor(
    readonly extensionId: string,
    readonly usageStatisticsRepo: IUsageStatisticsRepository,
    readonly downloadRepository: IDownloadRepository
  ) {}

  async process(): Promise<void> {
    const isDownloadedBySelf = (extId: string) => extId === this.extensionId
    const pastItems = await this.downloadRepository.search({ limit: 0 })

    const syncedStats = pastItems.reduce((stats, currItem) => {
      if (!isDownloadedBySelf(currItem.byExtensionId)) return stats
      return stats.increase({
        downloadCount: 1,
        trafficUsage: Math.max(0, currItem.fileSize),
      })
    }, new UsageStatics({ downloadCount: 0, trafficUsage: 0 }))

    const originalStats = await this.usageStatisticsRepo.get()

    if (syncedStats.isGreaterThan(originalStats)) {
      await this.usageStatisticsRepo.save(syncedStats)
    }
  }
}
