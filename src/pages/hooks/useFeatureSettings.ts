import type { FeatureSettings } from '#schema'
import { featureSettingsRepo } from '../../infraProvider'
import { useCallback, useEffect, useReducer } from 'react'

function reducer(
  settings: FeatureSettings,
  action:
    | PureAction<'toggleNsfw' | 'toggleThumbnail' | 'toggleKeyboardShortcut'>
    | DataInitAction<FeatureSettings>
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

    default:
      throw new Error()
  }
}

type Toggler = Record<'nsfw' | 'thumbnail' | 'keyboardShortcut', () => Promise<void>>

const useFeatureSettings = (): [FeatureSettings, Toggler] => {
  const [featureSettings, dispatch] = useReducer(
    reducer,
    featureSettingsRepo.getDefault()
  )

  const initSettings = useCallback(() => {
    featureSettingsRepo.get().then(settings => {
      dispatch({
        type: 'init',
        payload: settings,
      })
    })
  }, [])

  useEffect(() => {
    initSettings()
  }, [initSettings])

  const toggleRevealNsfw = useCallback(async () => {
    await featureSettingsRepo.save({
      autoRevealNsfw: !featureSettings.autoRevealNsfw,
    })
    dispatch({ type: 'toggleNsfw' })
  }, [featureSettings.autoRevealNsfw])

  const toggleThumbnail = useCallback(async () => {
    await featureSettingsRepo.save({
      includeVideoThumbnail: !featureSettings.includeVideoThumbnail,
    })
    dispatch({ type: 'toggleThumbnail' })
  }, [featureSettings.includeVideoThumbnail])

  const toggleKeyboardShortcut = useCallback(async () => {
    await featureSettingsRepo.save({
      keyboardShortcut: !featureSettings.keyboardShortcut,
    })
    dispatch({ type: 'toggleKeyboardShortcut' })
  }, [featureSettings.keyboardShortcut])

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
