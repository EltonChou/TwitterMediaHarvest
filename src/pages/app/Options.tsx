import { ChakraProvider, FormLabel } from '@chakra-ui/react'
import FeatureControlBlock from '@pages/components/FeatureControlBlock'
import IntegrationControlBlock from '@pages/components/IntegrationControlBlock'
import FilenameControlBlock from '@pages/components/FilenameControlBlock'
import React from 'react'

const App = () => {
  return (
    <ChakraProvider>
      <FormLabel as="legend" htmlFor={null}>
        Sub-directory
      </FormLabel>
      <FilenameControlBlock />
      <FormLabel as="legend" htmlFor={null}>
        Features
      </FormLabel>
      <FeatureControlBlock />
      <FormLabel as="legend" htmlFor={null}>
        Integrations
      </FormLabel>
      <IntegrationControlBlock />
    </ChakraProvider>
  )
}

export default App
