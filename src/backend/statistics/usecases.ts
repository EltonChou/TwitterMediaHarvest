import { IStatisticsRepository, IStatisticsRepositoryV4, StatisticsKey } from './repositories'

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
 * @deprecated Use {@link V4StatsUsecase} instead
 */
export default class StatisticsUseCases implements IStatisticsUseCase {
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

export class V4StatsUsecase {
  constructor(readonly statisticsRepo: IStatisticsRepositoryV4) {}

  async addDownloadCount(): Promise<void> {
    const stats = await this.statisticsRepo.getStats()
    stats.downloadCount += 1
    await this.statisticsRepo.saveStats(stats)
  }

  async addTraffic(amount: number): Promise<void> {
    if (amount <= 0) return
    const stats = await this.statisticsRepo.getStats()
    stats.trafficUsage += amount
    await this.statisticsRepo.saveStats(stats)
  }
}
