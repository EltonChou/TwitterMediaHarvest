import type { IUsageStatisticsUseCase } from '#domain/useCases/usageStatistics'
import type { IStorageProxy } from '@libs/proxy'
import type { V4Statistics } from '@schema'
import Browser from 'webextension-polyfill'

const defaultV4Stats: V4Statistics = Object.freeze({
  downloadCount: 0,
  trafficUsage: 0,
})

export class UsageStatisticsUseCase implements IUsageStatisticsUseCase {
  constructor(readonly storage: IStorageProxy<V4Statistics>) {}

  async get(): Promise<V4Statistics> {
    return this.storage.getItemByDefaults(defaultV4Stats)
  }

  async increase(statsDelta: V4Statistics): Promise<void> {
    const stats = await this.storage.getItemByDefaults(defaultV4Stats)
    stats.downloadCount += Math.max(statsDelta.downloadCount, 0)
    stats.trafficUsage += Math.max(statsDelta.trafficUsage, 0)
    await this.storage.setItem(stats)
  }

  async syncWithDownloadHistory(): Promise<void> {
    const pastItems = await Browser.downloads.search({ limit: 0 })
    const stats = await this.get()
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

    if (
      syncStats.downloadCount >= stats.downloadCount &&
      syncStats.trafficUsage >= stats.trafficUsage
    ) {
      await this.storage.setItem(syncStats)
    }
  }
}
