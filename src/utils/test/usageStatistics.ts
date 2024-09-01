import { UsageStatistics } from '#domain/valueObjects/usageStatistics'
import { faker } from '@faker-js/faker/locale/en'

export const generateUsageStatistics = () =>
  new UsageStatistics({
    downloadCount: faker.number.int(),
    trafficUsage: faker.number.int(),
  })
