import type { IUsageStatisticsRepository } from '#domain/repositories/usageStatistics'
import type { UsageStatistics } from '#domain/valueObjects/usageStatistics'

export class MockUsageStatisticsRepository implements IUsageStatisticsRepository {
  get(): Promise<UsageStatistics> {
    throw new Error('Method not implemented.')
  }
  save(stats: UsageStatistics): Promise<void> {
    throw new Error('Method not implemented.')
  }
}
