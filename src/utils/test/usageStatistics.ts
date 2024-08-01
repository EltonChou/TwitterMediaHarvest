import { UsageStatistics } from '#domain/valueObjects/usageStatistics'
import { faker } from '@faker-js/faker'

export const generateUsageStatistics = () =>
  new UsageStatistics({
    downloadCount: faker.number.int(),
    trafficUsage: faker.number.int(),
  })
