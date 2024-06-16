import type { IUsageStatisticsRepository } from '#domain/repositories/usageStatistics'
import type { V4Statistics } from '#schema'
import { AsyncUseCase } from './base'

type IncreaseCommand = { statsDelta: V4Statistics }

export class IncreaseUsageStatisticsUseCase
  implements AsyncUseCase<IncreaseCommand, void>
{
  constructor(readonly statisticRepo: IUsageStatisticsRepository) {}

  async process({ statsDelta }: IncreaseCommand): Promise<void> {
    const stats = await this.statisticRepo.get()
    stats.downloadCount += Math.max(statsDelta.downloadCount, 0)
    stats.trafficUsage += Math.max(statsDelta.trafficUsage, 0)
    return this.statisticRepo.save(stats)
  }
}
