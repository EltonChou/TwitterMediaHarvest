import type { IUsageStatisticsRepository } from '#domain/repositories/usageStatistics'
import { increaseStats } from '#utils/statistics'
import type { StatsDelta } from '#utils/statistics'
import type { AsyncUseCase } from './base'

type IncreaseCommand = { statsDelta: StatsDelta }

export class IncreaseUsageStatisticsUseCase
  implements AsyncUseCase<IncreaseCommand, void>
{
  constructor(readonly statisticRepo: IUsageStatisticsRepository) {}

  async process({ statsDelta }: IncreaseCommand): Promise<void> {
    const stats = await this.statisticRepo.get()
    return this.statisticRepo.save(increaseStats(statsDelta)(stats))
  }
}
