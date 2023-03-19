import { IStatisticsRepository, StatisticsKey } from './repositories'

export interface IStatisticsUseCase {
  getSuccessDownloadCount(): Promise<number>
  getFailedDownloadCount(): Promise<number>
  getErrorCount(): Promise<number>
  addSuccessDownloadCount(): Promise<void>
  addFailedDownloadCount(): Promise<void>
  addErrorCount(): Promise<void>
}

export default class StatisticsUseCases implements IStatisticsUseCase {
  statisticsRepo: IStatisticsRepository

  constructor(repo: IStatisticsRepository) {
    this.statisticsRepo = repo
  }

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
