import type { Storage } from 'webextension-polyfill'

export enum StatisticsKey {
  SuccessDownloadCount = 'successDownloadCount',
  FailedDownloadCount = 'failedDownloadCount',
  ErrorCount = 'errorCount',
}

type DownloadStatistic = {
  [StatisticsKey.SuccessDownloadCount]?: number
  [StatisticsKey.FailedDownloadCount]?: number
  [StatisticsKey.ErrorCount]?: number
}

const defaultStatistic: DownloadStatistic = {
  [StatisticsKey.ErrorCount]: 0,
  [StatisticsKey.FailedDownloadCount]: 0,
  [StatisticsKey.SuccessDownloadCount]: 0,
}

export interface IStatisticsRepository {
  getStatisticsCount(key: StatisticsKey): Promise<number>
  addStatisticsCount(key: StatisticsKey): Promise<void>
}

export default class StatisticsRepository implements IStatisticsRepository {
  readonly storageArea: Storage.StorageArea

  constructor(storageArea: Storage.StorageArea) {
    this.storageArea = storageArea
  }

  async getStatisticsCount(key: StatisticsKey): Promise<number> {
    const downloadStatistic: DownloadStatistic = {}
    downloadStatistic[key] = 0

    const count = await this.storageArea.get(downloadStatistic)
    return count[key]
  }

  async addStatisticsCount(key: StatisticsKey): Promise<void> {
    const count = await this.getStatisticsCount(key)
    const downloadCount: DownloadStatistic = {}
    downloadCount[key] = count + 1

    await this.storageArea.set(downloadCount)
  }

  async setDefaultStatistics(): Promise<void> {
    await this.storageArea.set(defaultStatistic)
  }
}
