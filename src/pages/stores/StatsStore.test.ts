import { UsageStatistics } from '#domain/valueObjects/usageStatistics'
import { createStatsStore } from './StatsStore'

describe('unit test for StatsStore', () => {
  const { getSnapShot, subscribe, triggerChange } = createStatsStore({
    getStats: async () =>
      new UsageStatistics({ downloadCount: 10, trafficUsage: 10 }),
  })

  it('can get snapshot', () => {
    const stats = getSnapShot()
    expect(stats instanceof UsageStatistics).toBeTruthy()
  })

  it('can subscribe', async () => {
    const mockOnChange = jest.fn()
    const unsubscribe = subscribe(mockOnChange)
    await triggerChange()
    expect(mockOnChange).toHaveBeenCalled()
    unsubscribe()
  })
})
