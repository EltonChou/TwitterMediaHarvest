import { useEffect, useSyncExternalStore } from 'react'

import { storageConfig } from '@backend/configurations'
import createStatsStore from '@pages/stores/StatsStore'

const { getSnapShot, subscribe, setStats } = createStatsStore()

const useStatsStore = () => {
  const stats = useSyncExternalStore(subscribe, getSnapShot)

  useEffect(() => {
    storageConfig.statisticsRepo.getStats().then(initStats => setStats(initStats))
  })

  return stats
}

export default useStatsStore
