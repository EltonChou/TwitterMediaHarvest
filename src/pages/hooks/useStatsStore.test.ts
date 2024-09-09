/**
 * @jest-environment jsdom
 */
import { UsageStatistics } from '#domain/valueObjects/usageStatistics'
import { createStatsStore } from '#pages/stores/StatsStore'
import useStatsStore from './useStatsStore'
import { renderHook } from '@testing-library/react'
import { act } from 'react'

describe('unit test for useStatsStore hook', () => {
  it('can update stats when the store is change', async () => {
    const getStats = jest
      .fn<Promise<UsageStatistics>, any, any>()
      .mockResolvedValue(new UsageStatistics({ downloadCount: 0, trafficUsage: 0 }))
    const statsStore = createStatsStore({ getStats })

    const { result } = renderHook(() => useStatsStore(statsStore))
    const originalStats = result.current

    getStats.mockResolvedValue(
      new UsageStatistics({ downloadCount: 10, trafficUsage: 100 })
    )

    act(() => {
      statsStore.triggerChange()
    })

    const stats = result.current
    expect(stats.isGreaterThan(originalStats))
  })
})
