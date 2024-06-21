import type { IDownloadRepository } from '#domain/repositories/download'
import type { IUsageStatisticsRepository } from '#domain/repositories/usageStatistics'
import type { V4Statistics } from '#schema'
import type { AsyncCommandUseCase } from './base'
import type { Downloads } from 'webextension-polyfill'

export class SyncUsageStatisticsWithDownloadHistory implements AsyncCommandUseCase<void> {
  constructor(
    readonly extensionId: string,
    readonly usageStatisticsRepo: IUsageStatisticsRepository,
    readonly downloadRepository: IDownloadRepository<
      Downloads.DownloadQuery,
      Downloads.DownloadItem
    >
  ) {}

  async process(): Promise<void> {
    const pastItems = await this.downloadRepository.search({ limit: 0 })
    const syncStats = pastItems.reduce(
      (stats, curr) => {
        if (curr.byExtensionId === this.extensionId) {
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
