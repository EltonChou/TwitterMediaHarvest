/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import type { ISettingsRepository } from '#domain/repositories/settings'
import { createSettingsStore } from '#pages/stores/SettingsStore'
import { useMemo, useSyncExternalStore } from 'react'

/**
 * Read settings stored as plain key-value pairs, staying in sync with
 * `browser.storage`.
 */
const useSettingsStore = <T extends object>(repo: ISettingsRepository<T>) => {
  const store = useMemo(
    () =>
      createSettingsStore({
        get: () => repo.get(),
        getDefault: () => repo.getDefault(),
        keys: new Set(Object.keys(repo.getDefault())),
      }),
    [repo]
  )
  return useSyncExternalStore(store.subscribe, store.getSnapShot)
}

export default useSettingsStore
