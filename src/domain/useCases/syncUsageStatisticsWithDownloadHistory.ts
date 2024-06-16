import { IUsageStatisticsRepository } from '#domain/repositories/usageStatistics'
import type { V4Statistics } from '#schema'
import type { AsyncCommandUseCase } from './base'
import Browser from 'webextension-polyfill'

export class SyncUsageStatisticsWithDownloadHistory implements AsyncCommandUseCase<void> {
  constructor(readonly usageStatisticsRepo: IUsageStatisticsRepository) {}

  async process(): Promise<void> {
    const pastItems = await Browser.downloads.search({ limit: 0 })
    const syncStats = pastItems.reduce(
      (stats, curr) => {
        if (curr.byExtensionId === Browser.runtime.id) {
          stats.downloadCount += 1
          stats.trafficUsage += Math.max(curr.fileSize, 0)
        }
        return stats
      },
      {
        downloadCount: 0,
        trafficUsage: 0,
      } as V4Statistics
    )

    const stats = await this.usageStatisticsRepo.get()
    if (
      syncStats.downloadCount >= stats.downloadCount &&
      syncStats.trafficUsage >= stats.trafficUsage
    ) {
      await this.usageStatisticsRepo.save(syncStats)
    }
  }
}
