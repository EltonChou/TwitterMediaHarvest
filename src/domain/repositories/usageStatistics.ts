import { UsageStatistics } from '#domain/valueObjects/usageStatistics'

export interface IUsageStatisticsRepository {
  get(): Promise<UsageStatistics>
  save(stats: UsageStatistics): Promise<void>
}
