import type { ISettingsRepository } from '#domain/repositories/settings'
import type { InitPayloadAction, PureAction } from '#pages/typings/reducerAction'
import type { FeatureSettings } from '#schema'
import { useCallback, useEffect, useReducer } from 'react'

function reducer(
  settings: FeatureSettings,
  action:
    | PureAction<'toggleNsfw' | 'toggleThumbnail' | 'toggleKeyboardShortcut'>
    | InitPayloadAction<FeatureSettings>
): FeatureSettings {
  switch (action.type) {
    case 'toggleNsfw':
      return { ...settings, autoRevealNsfw: !settings.autoRevealNsfw }

    case 'toggleThumbnail':
      return {
        ...settings,
        includeVideoThumbnail: !settings.includeVideoThumbnail,
      }

    case 'toggleKeyboardShortcut':
      return {
        ...settings,
        keyboardShortcut: !settings.keyboardShortcut,
      }

    case 'init':
      return action.payload
  }
}

type Toggler = Record<'nsfw' | 'thumbnail' | 'keyboardShortcut', () => Promise<void>>

const useFeatureSettings = (
  featureSettingsRepo: ISettingsRepository<FeatureSettings>
): [FeatureSettings, Toggler] => {
  const [featureSettings, dispatch] = useReducer(
    reducer,
    featureSettingsRepo.getDefault()
  )

  useEffect(() => {
    featureSettingsRepo.get().then(settings => {
      dispatch({
        type: 'init',
        payload: settings,
      })
    })
  }, [featureSettingsRepo])

  const toggleRevealNsfw = useCallback(async () => {
    await featureSettingsRepo.save({
      autoRevealNsfw: !featureSettings.autoRevealNsfw,
    })
    dispatch({ type: 'toggleNsfw' })
  }, [featureSettings.autoRevealNsfw, featureSettingsRepo])

  const toggleThumbnail = useCallback(async () => {
    await featureSettingsRepo.save({
      includeVideoThumbnail: !featureSettings.includeVideoThumbnail,
    })
    dispatch({ type: 'toggleThumbnail' })
  }, [featureSettings.includeVideoThumbnail, featureSettingsRepo])

  const toggleKeyboardShortcut = useCallback(async () => {
    await featureSettingsRepo.save({
      keyboardShortcut: !featureSettings.keyboardShortcut,
    })
    dispatch({ type: 'toggleKeyboardShortcut' })
  }, [featureSettings.keyboardShortcut, featureSettingsRepo])

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
