import type { Storage } from 'webextension-polyfill'

const defaultV4Stats: V4Statistics = {
  downloadCount: 0,
  trafficUsage: 0,
}

export interface IStatisticsRepositoryV4 {
  getStats(): Promise<V4Statistics>
  saveStats(stats: V4Statistics): Promise<void>
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
