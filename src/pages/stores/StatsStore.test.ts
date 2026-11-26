import { UsageStatistics } from '#domain/valueObjects/usageStatistics'
import { createStatsStore } from './StatsStore'
import { storage } from 'webextension-polyfill'

describe('unit test for StatsStore', () => {
  const getStats = jest
    .fn()
    .mockResolvedValue(
      new UsageStatistics({ downloadCount: 10, trafficUsage: 10 })
    )
  const { getSnapShot, subscribe, triggerChange } = createStatsStore({
    getStats,
  })

  const lastStorageListener = () =>
    jest.mocked(storage.onChanged.addListener).mock.lastCall![0]

  beforeEach(() => {
    getStats.mockClear()
    jest.mocked(storage.onChanged.addListener).mockClear()
    jest.mocked(storage.onChanged.removeListener).mockClear()
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

  it('should load stats and listen to storage on first subscription', async () => {
    const onChange = jest.fn()
    const unsubscribe = subscribe(onChange)

    expect(storage.onChanged.addListener).toHaveBeenCalledTimes(1)
    expect(getStats).toHaveBeenCalledTimes(1)
    await new Promise(resolve => setTimeout(resolve))
    expect(onChange).toHaveBeenCalled()

    unsubscribe()
  })

  it('should listen to storage only once for multiple subscribers', () => {
    const unsubscribeA = subscribe(jest.fn())
    const unsubscribeB = subscribe(jest.fn())

    expect(storage.onChanged.addListener).toHaveBeenCalledTimes(1)

    unsubscribeA()
    expect(storage.onChanged.removeListener).not.toHaveBeenCalled()

    unsubscribeB()
    expect(storage.onChanged.removeListener).toHaveBeenCalledWith(
      lastStorageListener()
    )
  })

  it('should not share state between stores', async () => {
    const other = createStatsStore({
      getStats: async () =>
        new UsageStatistics({ downloadCount: 99, trafficUsage: 99 }),
    })

    await other.triggerChange()
    await triggerChange()

    expect(other.getSnapShot().mapBy(props => props.downloadCount)).toBe(99)
    expect(getSnapShot().mapBy(props => props.downloadCount)).toBe(10)
  })

  it.each([
    { name: 'downloadCount', key: 'downloadCount', refreshes: true },
    { name: 'trafficUsage', key: 'trafficUsage', refreshes: true },
    { name: 'unrelated key', key: 'someOtherKey', refreshes: false },
  ])(
    'should refresh on storage change of $name: $refreshes',
    ({ key, refreshes }) => {
      const unsubscribe = subscribe(jest.fn())
      getStats.mockClear()

      lastStorageListener()({ [key]: { newValue: 1, oldValue: 0 } }, 'local')

      expect(getStats).toHaveBeenCalledTimes(refreshes ? 1 : 0)
      unsubscribe()
    }
  )
})
