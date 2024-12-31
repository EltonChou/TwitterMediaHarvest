import { UsageStatistics } from '#domain/valueObjects/usageStatistics'
import type { StatsStore } from '#pages/stores/StatsStore'
import type { V4Statistics } from '#schema'
import { useEffect, useSyncExternalStore } from 'react'

type Criteria = keyof V4Statistics

export const CHANGE_CRITERIAS: Set<Criteria> = new Set(['downloadCount', 'trafficUsage'])

const useStatsStore = (
  statsStore: StatsStore
): [
  UsageStatistics,
  { criterias: Set<Criteria>; triggerChange: () => Promise<void> },
] => {
  const { getSnapShot, subscribe, triggerChange, init } = statsStore
  const stats = useSyncExternalStore(subscribe, getSnapShot)

  useEffect(() => {
    init()
  }, [])

  return [stats, { criterias: CHANGE_CRITERIAS, triggerChange }]
}

export default useStatsStore
