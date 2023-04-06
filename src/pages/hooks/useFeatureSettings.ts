import { useCallback, useEffect, useReducer } from 'react'
import { storageConfig } from '@backend/configurations'

const defaultFeatureSettings: FeatureSettings = storageConfig.featureSettingsRepo.getDefaultSettings()

function reducer(
  settings: FeatureSettings,
  action: PureAction<'toggleNsfw' | 'toggleThumbnail'> | DataInitAction<FeatureSettings>
): FeatureSettings {
  switch (action.type) {
    case 'toggleNsfw':
      return { ...settings, autoRevealNsfw: !settings.autoRevealNsfw }

    case 'toggleThumbnail':
      return {
        ...settings,
        includeVideoThumbnail: !settings.includeVideoThumbnail,
      }

    case 'init':
      return action.payload

    default:
      throw new Error()
  }
}

type RevealNsfwToggler = () => Promise<void>
type ThumbnailToggler = () => Promise<void>

const useFeatureSettings = (): [FeatureSettings, RevealNsfwToggler, ThumbnailToggler] => {
  const [featureSettings, dispatch] = useReducer(reducer, defaultFeatureSettings)

  const initSettings = useCallback(() => {
    storageConfig.featureSettingsRepo.getSettings().then(settings => {
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
    await storageConfig.featureSettingsRepo.saveSettings({
      autoRevealNsfw: !featureSettings.autoRevealNsfw,
    })
    dispatch({ type: 'toggleNsfw' })
  }, [featureSettings.autoRevealNsfw])

  const toggleThumbnail = useCallback(async () => {
    await storageConfig.featureSettingsRepo.saveSettings({
      includeVideoThumbnail: !featureSettings.includeVideoThumbnail,
    })
    dispatch({ type: 'toggleThumbnail' })
  }, [featureSettings.includeVideoThumbnail])

  return [featureSettings, toggleRevealNsfw, toggleThumbnail]
}

export default useFeatureSettings
