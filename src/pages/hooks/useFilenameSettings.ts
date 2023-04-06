import { storageConfig } from '@backend/configurations'
import { useEffect, useReducer, useState } from 'react'
import type { Dispatch } from 'react'

type DirectorySetAction = {
  type: 'setDirectory'
} & DataActionWithPayload<string>

type FilenamePatternSetAction = {
  type: 'setFilenamePattern'
} & DataActionWithPayload<V4FilenamePattern>

type FilenameSettingsPureAction = PureAction<'toggleDirectory' | 'reset'>

type FilenameSettingsAction =
  | FilenameSettingsPureAction
  | DataInitAction<V4FilenameSettings>
  | DirectorySetAction
  | FilenamePatternSetAction

const defaultFilenameSettings = storageConfig.v4FilenameSettingsRepo.getDefaultSettings()

function settingReducer(settings: V4FilenameSettings, action: FilenameSettingsAction): V4FilenameSettings {
  switch (action.type) {
    case 'toggleDirectory':
      return { ...settings, noSubDirectory: !settings.noSubDirectory }

    case 'setDirectory':
      return { ...settings, directory: action.payload }

    case 'setFilenamePattern':
      return { ...settings, filenamePattern: action.payload }

    case 'init':
      return action.payload

    case 'reset':
      return defaultFilenameSettings

    default:
      throw new Error(`Unknown action: ${action}`)
  }
}

type FilenameDispatch = Dispatch<FilenameSettingsAction>

const useFilenameSettings = (): [V4FilenameSettings, FilenameDispatch] => {
  const [filenameSettings, settingsDispatch] = useReducer(settingReducer, defaultFilenameSettings)

  useEffect(() => {
    storageConfig.v4FilenameSettingsRepo.getSettings().then(settings => {
      settingsDispatch({ type: 'init', payload: settings })
    })
  }, [])

  return [filenameSettings, settingsDispatch]
}

export default useFilenameSettings
