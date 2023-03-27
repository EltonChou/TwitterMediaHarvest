import { storageConfig } from '@backend/configurations'
import { FormControl, FormLabel, SimpleGrid, Switch } from '@chakra-ui/react'
import React, { useEffect, useReducer } from 'react'
import browser from 'webextension-polyfill'

type IntegrationControlProps = {
  isOn: boolean
  isDisabled: boolean
  handleChange: () => void
}

const Aria2Control = ({ isOn, handleChange, isDisabled }: IntegrationControlProps) => {
  const controlId = 'pass-to-aria2'
  const aria2Link =
    process.env.TARGET === 'chrome'
      ? 'https://chrome.google.com/webstore/detail/' + 'mpkodccbngfoacfalldjimigbofkhgjn'
      : 'https://microsoftedge.microsoft.com/addons/detail/' + 'jjfgljkjddpcpfapejfkelkbjbehagbh'

  return (
    <>
      <FormLabel htmlFor={controlId} mb="0">
        Enable <a href={aria2Link}>Aria2 Explorer</a> capturing
      </FormLabel>
      <Switch id={controlId} isChecked={isOn} onChange={handleChange} disabled={isDisabled} />
    </>
  )
}

const AggressiveModeControl = ({ isOn, handleChange, isDisabled }: IntegrationControlProps) => {
  const controlId = 'aggressive-mode'
  return (
    <>
      <FormLabel htmlFor={controlId} mb="0">
        {browser.i18n.getMessage('aggressiveMode')}
      </FormLabel>
      <Switch id={controlId} isChecked={isOn} onChange={handleChange} disabled={isDisabled} />
    </>
  )
}

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

const IntegrationControls = () => {
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

export default IntegrationControls
