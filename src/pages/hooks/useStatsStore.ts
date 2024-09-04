import createStatsStore from '#pages/stores/StatsStore'
import { usageStatisticsRepo } from '../../infraProvider'
import { useEffect, useSyncExternalStore } from 'react'

const { getSnapShot, subscribe, setStats } = createStatsStore()

const useStatsStore = () => {
  const stats = useSyncExternalStore(subscribe, getSnapShot)

  useEffect(() => {
    usageStatisticsRepo.get().then(stats => setStats(stats.mapBy(props => props)))
  }, [])

  return stats
}

export default useStatsStore
