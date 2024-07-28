import { Factory } from '#domain/factories/base'
import type { IUsageStatisticsRepository } from '#domain/repositories/usageStatistics'
import { UsageStatics } from '#domain/valueObjects/usageStatistics'
import type { IStorageProxy } from '#libs/storageProxy'
import type { V4Statistics } from '#schema'

export class WebExtUsageStatisticsRepository implements IUsageStatisticsRepository {
  constructor(readonly storage: IStorageProxy<V4Statistics>) {}

  async get(): Promise<UsageStatics> {
    const item = await this.storage.getItemByDefaults({
      downloadCount: 0,
      trafficUsage: 0,
    })

    return new UsageStatics(item)
  }

  async save(stats: UsageStatics): Promise<void> {
    await this.storage.setItem(usageStaticsToItem(stats))
  }
}

const usageStaticsToItem: Factory<UsageStatics, V4Statistics> = stats =>
  stats.mapBy(({ downloadCount, trafficUsage }) => ({ downloadCount, trafficUsage }))
