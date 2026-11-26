/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import type { IWarningSettingsRepo } from '#domain/repositories/warningSettings'
import type { WarningSettings } from '#schema'
import useSettingsStore from './useSettingsStore'

type Toggler = Record<keyof WarningSettings, () => Promise<void>>

const useWarningSettings = (
  warningSettingsRepo: IWarningSettingsRepo
): {
  settings: WarningSettings
  toggler: Toggler
} => {
  const warningSettings = useSettingsStore(warningSettingsRepo)

  const toggleFilenameIgnoring = () =>
    warningSettingsRepo.save({
      ignoreFilenameOverwritten: !warningSettings.ignoreFilenameOverwritten,
    })

  return {
    settings: warningSettings,
    toggler: {
      ignoreFilenameOverwritten: toggleFilenameIgnoring,
    },
  }
}

export default useWarningSettings
