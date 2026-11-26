/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import type { ISettingsRepository } from '#domain/repositories/settings'
import type { DownloadSettings } from '#schema'
import useSettingsStore from './useSettingsStore'

type Toggler = Record<keyof DownloadSettings, () => Promise<void>>

const useDownloadSettings = (
  downloadSettingsRepo: ISettingsRepository<DownloadSettings>
): {
  settings: DownloadSettings
  toggler: Toggler
  canAskSaveLocation: boolean
} => {
  const downloadSettings = useSettingsStore(downloadSettingsRepo)

  const toggleAria2 = () => {
    if (downloadSettings.enableAria2 === false) {
      /* TODO: Test aria2 connection */
    }
    return downloadSettingsRepo.save({
      enableAria2: !downloadSettings.enableAria2,
    })
  }

  const toggleAggressive = () =>
    downloadSettingsRepo.save({
      aggressiveMode: !downloadSettings.aggressiveMode,
    })

  const toggleAskWhereToSave = () =>
    downloadSettingsRepo.save({
      askWhereToSave: !downloadSettings.askWhereToSave,
    })

  return {
    settings: downloadSettings,
    toggler: {
      enableAria2: toggleAria2,
      aggressiveMode: toggleAggressive,
      askWhereToSave: toggleAskWhereToSave,
    },
    canAskSaveLocation: downloadSettings.enableAria2 === false,
  }
}

export default useDownloadSettings
