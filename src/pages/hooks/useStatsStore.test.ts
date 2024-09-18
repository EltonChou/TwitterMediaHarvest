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
      .mockResolvedValue(new UsageStatistics({ downloadCount: 0, trafficUsage: 0 }))
    const statsStore = createStatsStore({ getStats })

    const mockListen = jest.fn()

    const { result } = renderHook(() =>
      useStatsStore(statsStore, {
        listenTo: (criterias, triggerChange) => {
          mockListen.mockImplementation(triggerChange)
        },
        neutralize: () => mockListen.mockClear(),
      })
    )
    const originalStats = result.current

    getStats.mockResolvedValue(
      new UsageStatistics({ downloadCount: 10, trafficUsage: 100 })
    )

    await act(statsStore.triggerChange)

    const stats = result.current
    expect(stats.isGreaterThan(originalStats))
  })
})
