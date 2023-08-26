import { statisticsRepo } from '@backend/configurations'
import createStatsStore from '@pages/stores/StatsStore'
import { useEffect, useSyncExternalStore } from 'react'

const { getSnapShot, subscribe, setStats } = createStatsStore()

const useStatsStore = () => {
  const stats = useSyncExternalStore(subscribe, getSnapShot)

  useEffect(() => {
    statisticsRepo.getStats().then(initStats => setStats(initStats))
  }, [])

  return stats
}

export default useStatsStore
