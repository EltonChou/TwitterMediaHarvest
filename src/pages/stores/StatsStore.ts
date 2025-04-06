/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { UsageStatistics } from '#domain/valueObjects/usageStatistics'
import type { IExternalStore } from './base'

export interface StatsStore extends IExternalStore<UsageStatistics> {
  init: () => void
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

      const triggerChange = () => updateStats().then(notifyListeners)

      instance = {
        getSnapShot: () => stats,
        init: triggerChange,
        triggerChange,
        subscribe: (onStoreChange: () => void) => {
          listeners.add(onStoreChange)

          return () => listeners.delete(onStoreChange)
        },
      }
    }

    return instance
  }
})()
