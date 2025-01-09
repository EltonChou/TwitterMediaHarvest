/**
 * @jest-environment jsdom
 */
import { UsageStatistics } from '#domain/valueObjects/usageStatistics'
import { createStatsStore } from '#pages/stores/StatsStore'
import useStatsStore from './useStatsStore'
import { act, renderHook } from '@testing-library/react'

describe('unit test for useStatsStore hook', () => {
  it('can update stats when the store is change', async () => {
    const getStats = jest
      .fn()
      .mockResolvedValue(
        new UsageStatistics({ downloadCount: 0, trafficUsage: 0 })
      )
    const statsStore = createStatsStore({ getStats })

    const { result } = renderHook(() => useStatsStore(statsStore))
    const [originalStats, { triggerChange }] = result.current

    getStats.mockResolvedValue(
      new UsageStatistics({ downloadCount: 10, trafficUsage: 100 })
    )

    await act(triggerChange)

    const [stats] = result.current
    expect(stats.isGreaterThan(originalStats))
  })
})
