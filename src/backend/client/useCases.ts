import { IClientInfoRepository } from './repositories'
import { IStatisticsRepositoryV4 } from '@backend/statistics/repositories'

export class ClientInfoUseCase {
  constructor(private infoRepo: IClientInfoRepository, private statsRepo: IStatisticsRepositoryV4) {}

  async sync(): Promise<void> {
    const info = await this.infoRepo.getInfo()
    if (info.needSync) {
      const stats = await this.statsRepo.getStats()
      await this.infoRepo.syncStats(stats)
    }
  }
}
