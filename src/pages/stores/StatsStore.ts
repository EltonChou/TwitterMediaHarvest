/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { UsageStatistics } from '#domain/valueObjects/usageStatistics'
import type { V4Statistics } from '#schema'
import type { IExternalStore } from './base'
import { type Storage, storage } from 'webextension-polyfill'

export interface StatsStore extends IExternalStore<UsageStatistics> {
  triggerChange: () => Promise<void>
}

export type CreateStoreParams = {
  getStats: () => Promise<UsageStatistics>
}

export const CHANGE_CRITERIAS: ReadonlySet<string> = new Set<
  keyof V4Statistics
>(['downloadCount', 'trafficUsage'])

export const createStatsStore = ({
  getStats,
}: CreateStoreParams): StatsStore => {
  let stats = new UsageStatistics({ downloadCount: 0, trafficUsage: 0 })
  const listeners = new Set<() => void>()

  const notifyListeners = () => listeners.forEach(onChange => onChange())

  const updateStats = () =>
    getStats().then(newStats => {
      stats = newStats
    })

  const triggerChange = () => updateStats().then(notifyListeners)

  const onStorageChanged: ListenerOf<Storage.Static['onChanged']> = (
    changes,
    _areaName
  ) => {
    if (Object.keys(changes).some(key => CHANGE_CRITERIAS.has(key)))
      triggerChange()
  }

  return {
    getSnapShot: () => stats,
    triggerChange,
    subscribe: (onStoreChange: () => void) => {
      if (listeners.size === 0) {
        storage.onChanged.addListener(onStorageChanged)
        triggerChange()
      }
      listeners.add(onStoreChange)

      return () => {
        listeners.delete(onStoreChange)
        if (listeners.size === 0)
          storage.onChanged.removeListener(onStorageChanged)
      }
    },
  }
}
