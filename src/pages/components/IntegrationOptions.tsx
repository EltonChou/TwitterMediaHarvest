import React from 'react'

import { Link, VStack } from '@chakra-ui/react'
import useIntegrationSettings from '@pages/hooks/useIntegrationSettings'
import Links from '@pages/links'
import type { HelperMessage } from './controls/featureControls'
import { RichFeatureSwitch } from './controls/featureControls'
import { i18n } from '@pages/utils'

const Aria2Description = () => {
  const desc = i18n('options_integrations_dispatchToAria2_desc')
  const [pre, post] = desc.split('Aria2-Explorer')
  if (process.env.TARGET === 'firefox')
    return (
      <>
        {pre} Aria2-Explorer {post}
      </>
    )

  return (
    <>
      {pre}
      <Link href={Links.aria2Explorer} target="_blank" color={'blue.400'}>
        Aria2-Explorer
      </Link>
      {post}
    </>
  )
}

const IntegrationOptions = () => {
  const [integrationSettings, toggleAria2, toggleAggressive] = useIntegrationSettings()

  const isFirefox = process.env.TARGET === 'firefox'
  const message: HelperMessage = isFirefox && {
    type: 'info',
    content: i18n('options_integrations_notCompatibble', 'Firefox'),
  }

  return (
    <VStack>
      <RichFeatureSwitch
        name={i18n('options_integrations_dispatchToAria2')}
        desc={<Aria2Description />}
        isOn={integrationSettings.enableAria2}
        handleClick={toggleAria2}
        isDisable={isFirefox}
        message={message}
      />
      <RichFeatureSwitch
        name={i18n('options_integrations_aggressiveMode')}
        desc={i18n('options_integrations_aggressiveMode_desc')}
        isOn={integrationSettings.aggressiveMode}
        handleClick={toggleAggressive}
        isDisable={isFirefox}
        message={message}
      />
    </VStack>
  )
}

export default IntegrationOptions
