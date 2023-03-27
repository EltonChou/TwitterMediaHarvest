import { ChakraProvider } from '@chakra-ui/react'
import FeatureSettingsControl from '@pages/components/controls/featureControls'
import React from 'react'

const Popup = () => {
  return (
    <ChakraProvider>
      <FeatureSettingsControl />
    </ChakraProvider>
  )
}

export default Popup
