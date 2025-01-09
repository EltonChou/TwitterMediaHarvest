import { UsageStatistics } from '#domain/valueObjects/usageStatistics'

describe('unit test for usage statistics value object', () => {
  it('can increase stats and return new object', () => {
    const stats = new UsageStatistics({ downloadCount: 1, trafficUsage: 100 })
    const updatedStats = stats.increase({ downloadCount: 2, trafficUsage: 200 })

    expect(updatedStats.mapBy(props => props.downloadCount)).toBe(3)
    expect(updatedStats.mapBy(props => props.trafficUsage)).toBe(300)
    expect(updatedStats).not.toBe(stats)
  })

  it('can compare two statistics', () => {
    const stats = new UsageStatistics({ downloadCount: 2, trafficUsage: 200 })
    const greaterStats = new UsageStatistics({
      downloadCount: 3,
      trafficUsage: 300,
    })
    const lessStats = new UsageStatistics({
      downloadCount: 1,
      trafficUsage: 100,
    })

    expect(greaterStats.isGreaterThan(stats)).toBeTruthy()
    expect(lessStats.isLessThan(stats)).toBeTruthy()
  })
})
