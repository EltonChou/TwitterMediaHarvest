import { Factory } from '#domain/factories/base'
import type { IUsageStatisticsRepository } from '#domain/repositories/usageStatistics'
import { UsageStatistics } from '#domain/valueObjects/usageStatistics'
import type { IStorageProxy } from '#libs/storageProxy'
import type { V4Statistics } from '#schema'

export class WebExtUsageStatisticsRepository
  implements IUsageStatisticsRepository
{
  constructor(readonly storage: IStorageProxy<V4Statistics>) {}

  async get(): Promise<UsageStatistics> {
    const item = await this.storage.getItemByDefaults({
      downloadCount: 0,
      trafficUsage: 0,
    })

    return new UsageStatistics(item)
  }

  async save(stats: UsageStatistics): Promise<void> {
    await this.storage.setItem(usageStaticsToItem(stats))
  }
}

const usageStaticsToItem: Factory<UsageStatistics, V4Statistics> = stats =>
  stats.mapBy(({ downloadCount, trafficUsage }) => ({
    downloadCount,
    trafficUsage,
  }))
