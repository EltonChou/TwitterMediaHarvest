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

const defaultV4Stats: V4Statistics = {
  downloadCount: 0,
  trafficUsage: 0,
}

/**
 * @deprecated
 */
export interface IStatisticsRepository {
  getStatisticsCount(key: StatisticsKey): Promise<number>
  addStatisticsCount(key: StatisticsKey): Promise<void>
}

export interface IStatisticsRepositoryV4 {
  getStats(): Promise<V4Statistics>
  saveStats(stats: V4Statistics): Promise<void>
}

/**
 * @deprecated
 */
export class StatisticsRepository implements IStatisticsRepository {
  constructor(readonly storageArea: Storage.StorageArea) {}

  async getStatistics(): Promise<DownloadStatistic> {
    const stats = await this.storageArea.get(defaultStatistic)
    return stats
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

  async setDefaultStatistics(defaultStats: DownloadStatistic = defaultStatistic): Promise<void> {
    await this.storageArea.set(defaultStats)
  }
}

export class V4StatisticsRepository implements IStatisticsRepositoryV4 {
  constructor(readonly storageArea: Storage.StorageArea) {}

  async getStats(): Promise<V4Statistics> {
    const stats = await this.storageArea.get(defaultV4Stats)
    return stats as V4Statistics
  }

  async saveStats(stats: V4Statistics): Promise<void> {
    await this.storageArea.set(stats)
  }
}
