import { UsageStatistics } from '#domain/valueObjects/usageStatistics'
import type { StatsStore } from '#pages/stores/StatsStore'
import type { V4Statistics } from '#schema'
import { useSyncExternalStore } from 'react'

const CHANGE_CRITERIAS: (keyof V4Statistics)[] = ['downloadCount', 'trafficUsage']

const useStatsStore = (
  statsStore: StatsStore
): [
  UsageStatistics,
  { criterias: (keyof V4Statistics)[]; triggerChange: () => Promise<void> }
] => {
  const { getSnapShot, subscribe, triggerChange } = statsStore
  const stats = useSyncExternalStore(subscribe, getSnapShot)

  return [stats, { criterias: CHANGE_CRITERIAS, triggerChange }]
}

export default useStatsStore
