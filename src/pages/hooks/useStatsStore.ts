import type { StatsStore } from '#pages/stores/StatsStore'
import type { V4Statistics } from '#schema'
import { useEffect, useSyncExternalStore } from 'react'

const CHANGE_CRITERIAS: (keyof V4Statistics)[] = ['downloadCount', 'trafficUsage']

export interface ChangeListener {
  /**
   * This method will be called when hook mounted.
   *
   * @param criterias storage crieria which the store cares.
   * @param triggerChange notify store to update stats.
   */
  listenTo(criterias: (keyof V4Statistics)[], triggerChange: () => void): void
  /**
   * This method will be called to clean listener when hook unmounted.
   */
  neutralize(): void
}

const useStatsStore = (statsStore: StatsStore, listener: ChangeListener) => {
  const { getSnapShot, subscribe, triggerChange } = statsStore
  const stats = useSyncExternalStore(subscribe, getSnapShot)

  useEffect(() => {
    listener.listenTo(CHANGE_CRITERIAS, triggerChange)
    return () => listener.neutralize()
  }, [triggerChange, listener])

  return stats
}

export default useStatsStore
