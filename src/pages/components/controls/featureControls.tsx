import { storageConfig } from '@backend/configurations'
import { FormControl, FormLabel, SimpleGrid, Switch } from '@chakra-ui/react'
import React, { useEffect, useReducer } from 'react'
import browser from 'webextension-polyfill'

type FeatureControlProps = {
  isOn: boolean
  handleChange: () => void
}

const AutoRevealNsfwSwitch = ({ isOn, handleChange }: FeatureControlProps) => {
  const controlId = 'auto-reveal-nsfw'
  return (
    <>
      <FormLabel htmlFor={controlId} mb="0">
        {browser.i18n.getMessage('autoRevealNsfw')}
      </FormLabel>
      <Switch id={controlId} isChecked={isOn} onChange={handleChange} />
    </>
  )
}

const VideoThumbnailSwitch = ({ isOn, handleChange }: FeatureControlProps) => {
  const controlId = 'include-thumbnail'
  return (
    <>
      <FormLabel htmlFor={controlId} mb="0">
        {browser.i18n.getMessage('downloadVideoThumbnail')}
      </FormLabel>
      <Switch id={controlId} isChecked={isOn} onChange={handleChange} />
    </>
  )
}

type FeatureAction = {
  type: 'toggleNsfw' | 'toggleThumbnail'
}

type FeatureInitAction = {
  type: 'init'
  payload: FeatureSettings
}

const defaultFeatureSettings: FeatureSettings = {
  autoRevealNsfw: false,
  includeVideoThumbnail: false,
}

function reducer(
  settings: FeatureSettings,
  action: FeatureAction | FeatureInitAction
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

const FeatureSettingsControls = () => {
  const [featureSettings, dispatch] = useReducer(reducer, defaultFeatureSettings)

  useEffect(() => {
    storageConfig.featureSettingsRepo.getSettings().then(settings => {
      dispatch({
        type: 'init',
        payload: settings,
      })
    })
  }, [])

  const toggleRevealNsfw = async () => {
    await storageConfig.featureSettingsRepo.saveSettings({
      autoRevealNsfw: !featureSettings.autoRevealNsfw,
    })
    dispatch({ type: 'toggleNsfw' })
  }

  const toggleThumbnail = async () => {
    await storageConfig.featureSettingsRepo.saveSettings({
      includeVideoThumbnail: !featureSettings.includeVideoThumbnail,
    })
    dispatch({ type: 'toggleThumbnail' })
  }

  return (
    <FormControl as={SimpleGrid} columns={{ base: 2, lg: 2 }}>
      <AutoRevealNsfwSwitch
        isOn={featureSettings.autoRevealNsfw}
        handleChange={toggleRevealNsfw}
      />
      <VideoThumbnailSwitch
        isOn={featureSettings.includeVideoThumbnail}
        handleChange={toggleThumbnail}
      />
    </FormControl>
  )
}

export default FeatureSettingsControls
