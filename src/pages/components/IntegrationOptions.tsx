import React from 'react'

import { Link, VStack } from '@chakra-ui/react'
import useIntegrationSettings from '@pages/hooks/useIntegrationSettings'
import Links from '@pages/links'
import type { HelperMessage } from './controls/featureControls'
import { RichFeatureSwitch } from './controls/featureControls'

const Aria2Description = () => {
  if (process.env.TARGET === 'firefox') return <>Transfer the download to Aria2 via Aria2-Explorer</>

  return (
    <>
      Transfer the download to Aria2 via{' '}
      <Link href={Links.aria2Explorer} target="_blank" color={'blue.400'}>
        Aria2-Explorer
      </Link>
      .
    </>
  )
}

const IntegrationOptions = () => {
  const [integrationSettings, toggleAria2, toggleAggressive] = useIntegrationSettings()

  const isFirefox = process.env.TARGET === 'firefox'
  const message: HelperMessage = isFirefox && {
    type: 'info',
    content: 'This integration is not compatible with Firefox',
  }

  return (
    <VStack>
      <RichFeatureSwitch
        name="Dispatch download to Aria2"
        desc={<Aria2Description />}
        isOn={integrationSettings.enableAria2}
        handleClick={toggleAria2}
        isDisable={isFirefox}
        message={message}
      />
      <RichFeatureSwitch
        name="Aggressive mode"
        desc={
          'Ensure the filename not to be modified by other extensions. ' +
          'This mode might be conflicted with other download management extensions.'
        }
        isOn={integrationSettings.aggressiveMode}
        handleClick={toggleAggressive}
        isDisable={isFirefox}
        message={message}
      />
    </VStack>
  )
}

export default IntegrationOptions
