import { IStatisticsRepository, IStatisticsRepositoryV4, StatisticsKey } from './repositories'
import Browser from 'webextension-polyfill'

/**
 * @deprecated The method should not be used
 */
export interface IStatisticsUseCase {
  getSuccessDownloadCount(): Promise<number>
  getFailedDownloadCount(): Promise<number>
  getErrorCount(): Promise<number>
  addSuccessDownloadCount(): Promise<void>
  addFailedDownloadCount(): Promise<void>
  addErrorCount(): Promise<void>
}

/**
 * @deprecated Use {@link V4StatsUseCase} instead
 */
export class StatisticsUseCases implements IStatisticsUseCase {
  constructor(readonly statisticsRepo: IStatisticsRepository) {}

  async getSuccessDownloadCount(): Promise<number> {
    const count = await this.statisticsRepo.getStatisticsCount(StatisticsKey.SuccessDownloadCount)
    return count
  }

  async getFailedDownloadCount(): Promise<number> {
    const count = await this.statisticsRepo.getStatisticsCount(StatisticsKey.FailedDownloadCount)
    return count
  }

  async getErrorCount(): Promise<number> {
    const count = await this.statisticsRepo.getStatisticsCount(StatisticsKey.ErrorCount)
    return count
  }

  async addSuccessDownloadCount(): Promise<void> {
    await this.statisticsRepo.addStatisticsCount(StatisticsKey.SuccessDownloadCount)
  }

  async addFailedDownloadCount(): Promise<void> {
    await this.statisticsRepo.addStatisticsCount(StatisticsKey.FailedDownloadCount)
  }

  async addErrorCount(): Promise<void> {
    await this.statisticsRepo.addStatisticsCount(StatisticsKey.ErrorCount)
  }
}

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
          stats.trafficUsage += curr.fileSize < 0 ? 0 : curr.fileSize
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
