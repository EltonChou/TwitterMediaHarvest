import { ChakraProvider, FormLabel } from '@chakra-ui/react'
import FeatureSettingsControls from '@pages/components/controls/featureControls'
import FilenameControlForm from '@pages/components/controls/filenameControls'
import IntegrationControls from '@pages/components/controls/integrartionControls'
import React from 'react'

const App = () => {
  return (
    <ChakraProvider>
      <FilenameControlForm />
      <FormLabel as="legend" htmlFor={null}>
        Feature Options
      </FormLabel>
      <FeatureSettingsControls />
      <FormLabel as="legend" htmlFor={null}>
        Integration Options
      </FormLabel>
      <IntegrationControls />
    </ChakraProvider>
  )
}

export default App
