/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import type { IExternalStore } from './base'
import { type Storage, storage } from 'webextension-polyfill'

export interface SettingsStore<T> extends IExternalStore<T> {
  getIsLoaded: () => boolean
  /** Reload settings from the repository and notify subscribers. */
  triggerChange: () => Promise<void>
}

export type CreateSettingsStoreParams<T> = {
  get: () => Promise<T>
  getDefault: () => T
  /** Storage keys holding the settings. Changes to other keys are ignored. */
  keys: ReadonlySet<string>
}

/**
 * Settings kept in `browser.storage`, exposed for `useSyncExternalStore`.
 *
 * Settings are loaded on first subscription and reloaded whenever one of
 * `keys` changes in storage.
 */
export const createSettingsStore = <T>({
  get,
  getDefault,
  keys,
}: CreateSettingsStoreParams<T>): SettingsStore<T> => {
  let settings = getDefault()
  let isLoaded = false
  let latestLoad = 0
  let latestLoading: Promise<void> = Promise.resolve()
  const listeners = new Set<() => void>()

  const notifyListeners = () => listeners.forEach(onChange => onChange())

  const triggerChange = (): Promise<void> => {
    const load = ++latestLoad
    latestLoading = get().then(newSettings => {
      // A newer load has started, so this result may be outdated.
      // Settle once the newer load has been applied instead.
      if (load !== latestLoad) return latestLoading
      settings = newSettings
      isLoaded = true
      notifyListeners()
    })
    return latestLoading
  }

  const onStorageChanged: ListenerOf<Storage.Static['onChanged']> = (
    changes,
    _areaName
  ) => {
    if (Object.keys(changes).some(key => keys.has(key))) triggerChange()
  }

  return {
    getSnapShot: () => settings,
    getIsLoaded: () => isLoaded,
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
