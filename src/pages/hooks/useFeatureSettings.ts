/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import type { ISettingsRepository } from '#domain/repositories/settings'
import type { FeatureSettings } from '#schema'
import useSettingsStore from './useSettingsStore'
import { useCallback } from 'react'

type Toggler = Record<
  'nsfw' | 'thumbnail' | 'keyboardShortcut',
  () => Promise<void>
>

const useFeatureSettings = (
  featureSettingsRepo: ISettingsRepository<FeatureSettings>
): [FeatureSettings, Toggler] => {
  const featureSettings = useSettingsStore(featureSettingsRepo)

  const toggleRevealNsfw = useCallback(
    () =>
      featureSettingsRepo.save({
        autoRevealNsfw: !featureSettings.autoRevealNsfw,
      }),
    [featureSettings.autoRevealNsfw, featureSettingsRepo]
  )

  const toggleThumbnail = useCallback(
    () =>
      featureSettingsRepo.save({
        includeVideoThumbnail: !featureSettings.includeVideoThumbnail,
      }),
    [featureSettings.includeVideoThumbnail, featureSettingsRepo]
  )

  const toggleKeyboardShortcut = useCallback(
    () =>
      featureSettingsRepo.save({
        keyboardShortcut: !featureSettings.keyboardShortcut,
      }),
    [featureSettings.keyboardShortcut, featureSettingsRepo]
  )

  return [
    featureSettings,
    {
      nsfw: toggleRevealNsfw,
      thumbnail: toggleThumbnail,
      keyboardShortcut: toggleKeyboardShortcut,
    },
  ]
}

export default useFeatureSettings
