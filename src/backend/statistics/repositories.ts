import {
  BrowserStorageFetcher,
  BrowserStorageSetter,
  storageFetcher,
  storageSetter
} from '../../libs/chromeApi'

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
  private fetchStorage: BrowserStorageFetcher
  private setStorage: BrowserStorageSetter

  constructor(storageArea: chrome.storage.StorageArea) {
    this.fetchStorage = storageFetcher(storageArea)
    this.setStorage = storageSetter(storageArea)
  }

  async getStatisticsCount(
    key: StatisticsKey
  ): Promise<number> {
    const downloadStatistic: DownloadStatistic = {}
    downloadStatistic[key] = 0

    const count = await this.fetchStorage(downloadStatistic)
    return count[key]
  }

  async addStatisticsCount(key: StatisticsKey): Promise<void> {
    const count = await this.getStatisticsCount(key)
    const downloadCount: DownloadStatistic = {}
    downloadCount[key] = count + 1

    await this.setStorage(downloadCount)
  }

  async setDefaultStatistics(): Promise<void> {
    await this.setStorage(defaultStatistic)
  }
}