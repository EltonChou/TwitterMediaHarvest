import { IStatisticsRepositoryV4 } from './repositories'
import Browser from 'webextension-polyfill'

export class V4StatsUseCase {
  constructor(readonly statisticsRepo: IStatisticsRepositoryV4) {}

  async addDownloadCount(amount?: number): Promise<void> {
    if (amount && amount <= 0) return
    const stats = await this.statisticsRepo.getStats()
    stats.downloadCount += amount || 1
    await this.statisticsRepo.saveStats(stats)
  }

  async addTraffic(amount: number): Promise<void> {
    if (amount <= 0) return
    const stats = await this.statisticsRepo.getStats()
    stats.trafficUsage += amount
    await this.statisticsRepo.saveStats(stats)
  }

  async getStatByKey(key: keyof V4Statistics): Promise<number> {
    const stats = await this.statisticsRepo.getStats()
    return stats[key]
  }

  async syncWithDownloadHistory(): Promise<void> {
    const pastItems = await Browser.downloads.search({ limit: 0 })
    const stats = await this.statisticsRepo.getStats()
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

    if (syncStats.downloadCount > stats.downloadCount && syncStats.trafficUsage > stats.trafficUsage) {
      await this.statisticsRepo.saveStats(syncStats)
    }
  }
}
