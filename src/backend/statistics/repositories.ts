import type { IStorageProxy } from '@libs/proxy'
import type { V4Statistics } from '@schema'

const defaultV4Stats: V4Statistics = {
  downloadCount: 0,
  trafficUsage: 0,
}

export interface IStatisticsRepositoryV4 {
  getStats(): Promise<V4Statistics>
  saveStats(stats: V4Statistics): Promise<void>
}

export class V4StatisticsRepository implements IStatisticsRepositoryV4 {
  constructor(readonly storage: IStorageProxy<V4Statistics>) {}

  async getStats(): Promise<V4Statistics> {
    const stats = await this.storage.getItemByDefaults(defaultV4Stats)
    return stats
  }

  async saveStats(stats: V4Statistics): Promise<void> {
    await this.storage.setItem(stats)
  }
}
