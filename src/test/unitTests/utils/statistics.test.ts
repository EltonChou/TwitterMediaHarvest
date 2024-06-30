import type { V4Statistics } from '#schema'
import { increaseStats } from '#utils/statistics'

describe('unit test for statisctics utils', () => {
  it('can increase statistics', () => {
    const originalStats: V4Statistics = {
      downloadCount: 10,
      trafficUsage: 100,
    }

    const increasedStats = increaseStats({ downloadCount: 2, trafficUsage: 50 })(
      originalStats
    )

    expect(increasedStats).toEqual({ downloadCount: 12, trafficUsage: 150 })
    expect(originalStats).not.toEqual(increasedStats)
  })
})
