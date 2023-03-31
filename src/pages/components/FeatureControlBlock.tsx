import { storageConfig } from '@backend/configurations'
import type { StackProps } from '@chakra-ui/react'
import { Box, Flex, FormControl, SimpleGrid, Stack, VStack } from '@chakra-ui/react'
import React, { useCallback, useEffect, useReducer } from 'react'
import browser from 'webextension-polyfill'
import { FeatureSwitch } from './controls/featureControls'

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

const FeatureControlBlock = (props: StackProps) => {
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

  return (
    <Stack direction={'column'} {...props}>
      <FeatureSwitch
        controlId="auto-reveal-nsfw"
        isOn={featureSettings.autoRevealNsfw}
        handleChange={toggleRevealNsfw}
        labelContent={browser.i18n.getMessage('autoRevealNsfwShort')}
      />
      <FeatureSwitch
        controlId="thumbnail"
        isOn={featureSettings.includeVideoThumbnail}
        handleChange={toggleThumbnail}
        labelContent={browser.i18n.getMessage('downloadVideoThumbnail')}
      />
    </Stack>
  )
}

export default FeatureControlBlock
