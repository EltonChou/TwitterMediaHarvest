import { UsageStatics } from '#domain/valueObjects/usageStatistics'

export interface IUsageStatisticsRepository {
  get(): Promise<UsageStatics>
  save(stats: UsageStatics): Promise<void>
}
