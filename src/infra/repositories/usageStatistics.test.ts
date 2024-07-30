import { UsageStatistics } from '#domain/valueObjects/usageStatistics'
import { InMemoryStorageProxy } from '#mocks/storageProxy'
import type { V4Statistics } from '#schema'
import { WebExtUsageStatisticsRepository } from './usageStatistics'

describe('unit test for web ext usage statistics repository', () => {
  const storageProxy = new InMemoryStorageProxy<V4Statistics>()
  const repo = new WebExtUsageStatisticsRepository(storageProxy)

  it('can get usage statistics', async () => {
    const stats = await repo.get()

    expect(stats).toBeDefined()
  })

  it('can save usage statistics', async () => {
    const stats = new UsageStatistics({ downloadCount: 10, trafficUsage: 10 })

    await repo.save(stats)

    const fetchedStats = await repo.get()

    expect(stats.is(fetchedStats)).toBeTruthy()
  })
})
