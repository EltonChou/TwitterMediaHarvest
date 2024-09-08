import type { StatsStore } from '#pages/stores/StatsStore'
import type { V4Statistics } from '#schema'
import { useCallback, useEffect, useSyncExternalStore } from 'react'
import { type Storage, storage } from 'webextension-polyfill'

const CHANGE_CRITERIAS: (keyof V4Statistics)[] = ['downloadCount', 'trafficUsage']

const useStatsStore = (statsStore: StatsStore) => {
  const { getSnapShot, subscribe, triggerChange } = statsStore
  const stats = useSyncExternalStore(subscribe, getSnapShot)
  const handleChange = useCallback(
    (changes: Storage.StorageAreaOnChangedChangesType, areaName: string) => {
      if (CHANGE_CRITERIAS.some(criteria => criteria in changes)) triggerChange()
    },
    [triggerChange]
  )

  useEffect(() => {
    storage.onChanged.addListener(handleChange)
    return () => storage.onChanged.removeListener(handleChange)
  }, [handleChange])

  return stats
}

export default useStatsStore
