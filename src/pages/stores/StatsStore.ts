import { storageConfig } from '@backend/configurations'
import { Storage } from 'webextension-polyfill'
import { IExternalStore } from './base'

interface StatsStore extends IExternalStore<V4Statistics> {
  setStats: (initStats: V4Statistics) => void
}

const createStatsStore = (() => {
  let instance: StatsStore | null = null

  let stats = { downloadCount: 0, trafficUsage: 0 }
  const listeners = new Set<() => void>()

  const handleChange = (changes: Storage.StorageAreaOnChangedChangesType) => {
    if ('downloadCount' in changes || 'trafficUsage' in changes) {
      listeners.forEach(onChange => onChange())
    }
  }

  return () => {
    if (instance) return instance

    instance = {
      getSnapShot: () => stats,
      subscribe: (onStoreChange: () => void) => {
        listeners.add(onStoreChange)
        if (!storageConfig.statisticsRepo.storageArea.onChanged.hasListener(handleChange)) {
          storageConfig.statisticsRepo.storageArea.onChanged.addListener(handleChange)
        }

        return () => {
          listeners.delete(onStoreChange)
          if (listeners.size === 0) {
            storageConfig.statisticsRepo.storageArea.onChanged.removeListener(handleChange)
          }
        }
      },
      setStats: (newStats: V4Statistics) => {
        stats = { ...stats, ...newStats }
        listeners.forEach(onChange => onChange())
      },
    }
    return instance
  }
})()

export default createStatsStore
