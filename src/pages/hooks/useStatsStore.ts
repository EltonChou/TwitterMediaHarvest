/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { UsageStatistics } from '#domain/valueObjects/usageStatistics'
import type { StatsStore } from '#pages/stores/StatsStore'
import type { V4Statistics } from '#schema'
import { useEffect, useSyncExternalStore } from 'react'

type Criteria = keyof V4Statistics

export const CHANGE_CRITERIAS: Set<Criteria> = new Set([
  'downloadCount',
  'trafficUsage',
])

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
  }, [init])

  return [stats, { criterias: CHANGE_CRITERIAS, triggerChange }]
}

export default useStatsStore
