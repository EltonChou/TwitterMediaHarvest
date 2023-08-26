import { downloadSettingsRepo } from '@backend/configurations'
import type { DownloadSettings } from '@schema'
import { useEffect, useReducer } from 'react'

type IntegrationAction = {
  type: 'toggleAria2' | 'toggleAggressive' | 'toggleAskWhere'
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
    case 'toggleAskWhere':
      return { ...settings, askWhereToSave: !settings.askWhereToSave }
    case 'init':
      return action.payload
    default:
      throw new Error()
  }
}

const defaultIntegrationSettings = downloadSettingsRepo.getDefaultSettings()

type Toggler = Record<keyof DownloadSettings, () => Promise<void>>

const useDownloadSettings = (): [DownloadSettings, Toggler] => {
  const [downloadSettings, dispatch] = useReducer(reducer, defaultIntegrationSettings)
  useEffect(() => {
    downloadSettingsRepo.getSettings().then(settings => {
      dispatch({
        type: 'init',
        payload: settings,
      })
    })
  }, [])

  const toggleAria2 = async () => {
    if (downloadSettings.enableAria2 === false) {
      /* TODO: Test aria2 connection */
    }
    await downloadSettingsRepo.saveSettings({
      enableAria2: !downloadSettings.enableAria2,
    })
    dispatch({ type: 'toggleAria2' })
  }

  const toggleAggressive = async () => {
    await downloadSettingsRepo.saveSettings({
      aggressiveMode: !downloadSettings.aggressiveMode,
    })
    dispatch({ type: 'toggleAggressive' })
  }

  const toggleAskWhereToSave = async () => {
    await downloadSettingsRepo.saveSettings({
      askWhereToSave: !downloadSettings.askWhereToSave,
    })
    dispatch({ type: 'toggleAskWhere' })
  }

  return [
    downloadSettings,
    { enableAria2: toggleAria2, aggressiveMode: toggleAggressive, askWhereToSave: toggleAskWhereToSave },
  ]
}

export default useDownloadSettings
