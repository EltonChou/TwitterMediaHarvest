import { storageConfig } from '@backend/configurations'
import { ChakraProvider } from '@chakra-ui/react'
import { AutoRevealNsfwControl, VideoThumbnailControl } from '@pages/components/controls/featureControls'
import React, { useEffect, useReducer, useState } from 'react'

const defaultFeatureSettings: FeatureSettings = {
  autoRevealNsfw: false,
  includeVideoThumbnail: false,
}

function reducer(settings: FeatureSettings, action: FeatureAction | FeatureInitAction): FeatureSettings {
  switch (action.type) {
    case 'toggleNsfw':
      return { ...settings, autoRevealNsfw: !settings.autoRevealNsfw }
    case 'toggleThumbnail':
      return { ...settings, includeVideoThumbnail: !settings.includeVideoThumbnail }
    case 'init':
      return action.payload
    default:
      throw new Error()
  }
}

const FeatureSettingsForm = () => {
  const [featureSettings, dispatch] = useReducer(reducer, defaultFeatureSettings)

  useEffect(() => {
    storageConfig.featureSettingsRepo.getSettings().then(settings => {
      dispatch({
        type: 'init',
        payload: settings,
      })
    })
  }, [])

  const toggleRevealNsfw = () => dispatch({ type: 'toggleNsfw' })
  const toggleThumbnail = () => dispatch({ type: 'toggleThumbnail' })

  return (
    <div>
      <AutoRevealNsfwControl isEnabled={featureSettings.autoRevealNsfw} handleChange={toggleRevealNsfw} />
      <VideoThumbnailControl isEnabled={featureSettings.includeVideoThumbnail} handleChange={toggleThumbnail} />
    </div>
  )
}

const Popup = () => {
  return (
    <ChakraProvider>
      <FeatureSettingsForm />
    </ChakraProvider>
  )
}

export default Popup
