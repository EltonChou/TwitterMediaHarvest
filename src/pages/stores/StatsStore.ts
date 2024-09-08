import { UsageStatistics } from '#domain/valueObjects/usageStatistics'
import type { IExternalStore } from './base'

export interface StatsStore extends IExternalStore<UsageStatistics> {
  triggerChange: () => Promise<void>
}

export type CreateStoreParams = {
  getStats: () => Promise<UsageStatistics>
}

export const createStatsStore = (() => {
  let instance: StatsStore

  let stats = new UsageStatistics({ downloadCount: 0, trafficUsage: 0 })
  const listeners = new Set<() => void>()

  const notifyListeners = () => listeners.forEach(onChange => onChange())

  return ({ getStats }: CreateStoreParams) => {
    if (!instance) {
      const updateStats = () =>
        getStats().then(newStats => {
          stats = newStats
        })

      updateStats()

      instance = {
        getSnapShot: () => stats,
        triggerChange: () => updateStats().then(() => notifyListeners()),
        subscribe: (onStoreChange: () => void) => {
          listeners.add(onStoreChange)

          return () => listeners.delete(onStoreChange)
        },
      }
    }

    return instance
  }
})()
