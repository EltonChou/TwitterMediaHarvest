import { storageConfig } from '@backend/configurations'
import { useEffect, useReducer } from 'react'

type IntegrationAction = {
  type: 'toggleAria2' | 'toggleAggressive'
}

type IntegrationInitAction = {
  type: 'init'
  payload: DownloadSettings
}

function reducer(settings: DownloadSettings, action: IntegrationAction | IntegrationInitAction): DownloadSettings {
  switch (action.type) {
    case 'toggleAggressive':
      return { ...settings, aggressiveMode: !settings.aggressiveMode }
    case 'toggleAria2':
      return { ...settings, enableAria2: !settings.enableAria2 }
    case 'init':
      return action.payload
    default:
      throw new Error()
  }
}

const defaultIntegrationSettings = storageConfig.downloadSettingsRepo.getDefaultSettings()

type AggressiveModeToggler = () => Promise<void>
type Aria2Toggler = () => Promise<void>

const useIntegrationSettings = (): [DownloadSettings, Aria2Toggler, AggressiveModeToggler] => {
  const [integrationSettings, dispatch] = useReducer(reducer, defaultIntegrationSettings)
  useEffect(() => {
    storageConfig.downloadSettingsRepo.getSettings().then(settings => {
      dispatch({
        type: 'init',
        payload: settings,
      })
    })
  }, [])

  const toggleAria2 = async () => {
    if (integrationSettings.enableAria2 === false) {
      /* TODO: Test aria2 connection */
    }
    await storageConfig.downloadSettingsRepo.saveSettings({
      enableAria2: !integrationSettings.enableAria2,
    })
    dispatch({ type: 'toggleAria2' })
  }

  const toggleAggressive = async () => {
    await storageConfig.downloadSettingsRepo.saveSettings({
      aggressiveMode: !integrationSettings.aggressiveMode,
    })
    dispatch({ type: 'toggleAggressive' })
  }

  return [integrationSettings, toggleAria2, toggleAggressive]
}

export default useIntegrationSettings
