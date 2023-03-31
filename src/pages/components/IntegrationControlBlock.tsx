import { storageConfig } from '@backend/configurations'
import { FormControl, SimpleGrid } from '@chakra-ui/react'
import React, { useEffect, useReducer } from 'react'
import { AggressiveModeControl, Aria2Control } from './controls/integrartionControls'

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
      return { ...settings, aggressive_mode: !settings.aggressive_mode }
    case 'toggleAria2':
      return { ...settings, enableAria2: !settings.enableAria2 }
    case 'init':
      return action.payload
    default:
      throw new Error()
  }
}

const defaultIntegrationSettings: DownloadSettings = {
  enableAria2: false,
  aggressive_mode: false,
}

const IntegrationControlBlock = () => {
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
    await storageConfig.downloadSettingsRepo.saveSettings({
      enableAria2: !integrationSettings.enableAria2,
    })
    dispatch({ type: 'toggleAria2' })
  }

  const toggleAggressive = async () => {
    await storageConfig.downloadSettingsRepo.saveSettings({
      aggressive_mode: !integrationSettings.aggressive_mode,
    })
    dispatch({ type: 'toggleAggressive' })
  }

  return (
    <FormControl as={SimpleGrid} columns={{ base: 2, lg: 2 }}>
      {process.env.TARGET === 'chrome' ? (
        <Aria2Control
          isOn={integrationSettings.enableAria2}
          handleChange={toggleAria2}
          isDisabled={process.env.TARGET !== 'chrome'}
        />
      ) : (
        <></>
      )}
      <AggressiveModeControl
        isOn={integrationSettings.aggressive_mode}
        handleChange={toggleAggressive}
        isDisabled={process.env.TARGET === 'firefox'}
      />
    </FormControl>
  )
}

export default IntegrationControlBlock
