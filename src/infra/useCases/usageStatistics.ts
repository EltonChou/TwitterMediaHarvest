import type { IUsageStatisticsUseCase } from '#domain/useCases/usageStatistics'
import type { IStorageProxy } from '@libs/proxy'
import type { V4Statistics } from '@schema'

const defaultV4Stats: V4Statistics = Object.freeze({
  downloadCount: 0,
  trafficUsage: 0,
})

export class V4StatisticsRepository implements IUsageStatisticsUseCase {
  constructor(readonly storage: IStorageProxy<V4Statistics>) {}

  async increase(statsDelta: V4Statistics): Promise<void> {
    const stats = await this.storage.getItemByDefaults(defaultV4Stats)
    stats.downloadCount += statsDelta.downloadCount
    stats.trafficUsage += statsDelta.trafficUsage
    await this.storage.setItem(stats)
  }
}
