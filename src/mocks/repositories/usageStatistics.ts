import type { IUsageStatisticsRepository } from '#domain/repositories/usageStatistics'
import { UsageStatistics } from '#domain/valueObjects/usageStatistics'

export class MockUsageStatisticsRepository
  implements IUsageStatisticsRepository
{
  protected stats: UsageStatistics
  constructor() {
    this.stats = new UsageStatistics({ downloadCount: 0, trafficUsage: 0 })
  }
  async get(): Promise<UsageStatistics> {
    return this.stats
  }
  async save(stats: UsageStatistics): Promise<void> {
    this.stats = stats
  }
}
