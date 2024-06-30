import type { IDownloadRepository } from '#domain/repositories/download'
import type { IUsageStatisticsRepository } from '#domain/repositories/usageStatistics'
import type { V4Statistics } from '#schema'
import { increaseStats } from '#utils/statistics'
import type { AsyncCommandUseCase } from './base'

type DownloadQuery = {
  limit: number
}

type DownloadItem = {
  byExtensionId?: string
  fileSize: number
}

export class SyncUsageStatisticsWithLocalDownloadHistory
  implements AsyncCommandUseCase<void>
{
  constructor(
    readonly extensionId: string,
    readonly usageStatisticsRepo: IUsageStatisticsRepository,
    readonly downloadRepository: IDownloadRepository<DownloadQuery, DownloadItem>
  ) {}

  async process(): Promise<void> {
    const isDownloadedBySelf = (extId: string) => extId === this.extensionId
    const pastItems = await this.downloadRepository.search({ limit: 0 })
    const syncStats = pastItems.reduce(
      (stats, curr) => {
        return isDownloadedBySelf(curr.byExtensionId)
          ? increaseStats({
              downloadCount: 1,
              trafficUsage: Math.max(curr.fileSize, 0),
            })(stats)
          : stats
      },
      {
        downloadCount: 0,
        trafficUsage: 0,
      } as V4Statistics
    )

    const stats = await this.usageStatisticsRepo.get()
    const isGreaterThanOriginal = (newStats: V4Statistics) =>
      newStats.downloadCount >= stats.downloadCount &&
      newStats.trafficUsage >= stats.trafficUsage

    if (isGreaterThanOriginal(syncStats)) {
      await this.usageStatisticsRepo.save(syncStats)
    }
  }
}
