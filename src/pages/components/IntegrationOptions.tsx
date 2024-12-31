import type { ISettingsRepository } from '#domain/repositories/settings'
import { isFirefox } from '#helpers/runtime'
import { getText as i18n } from '#libs/i18n'
import useDownloadSettings from '#pages/hooks/useDownloadSettings'
import Links from '#pages/links'
import type { DownloadSettings } from '#schema'
import type { HelperMessage } from './controls/featureControls'
import { RichFeatureSwitch } from './controls/featureControls'
import { Link, VStack } from '@chakra-ui/react'
import React from 'react'

const Aria2Description = () => {
  const desc = i18n(
    'Transfer the download to Aria2 via Aria2-Explorer.',
    'options:integrations'
  )
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

type IntegrationOptionsProps = {
  downloadSettingsRepo: ISettingsRepository<DownloadSettings>
}

/**
 * Some switches is disabled when `process.env.TARGET` is `firefox`.
 */
const IntegrationOptions = (props: IntegrationOptionsProps) => {
  const { settings: integrationSettings, toggler } = useDownloadSettings(
    props.downloadSettingsRepo
  )
  const isInFireFox = isFirefox()

  const message: HelperMessage | undefined = isInFireFox
    ? {
        type: 'info',
        content: i18n(
          'This integration is not compatible with {{platform}}',
          'options:integrations',
          { platform: 'Firefox' }
        ),
      }
    : undefined

  return (
    <VStack>
      <RichFeatureSwitch
        name={i18n('Dispatch download to Aria2', 'options:integrations')}
        desc={<Aria2Description />}
        isOn={integrationSettings.enableAria2}
        handleClick={toggler.enableAria2}
        isDisable={isInFireFox}
        message={message}
        testId="dispatchToAria2-feature-switch"
      />
      <RichFeatureSwitch
        name={i18n('Aggressive Mode', 'options:integrations')}
        desc={i18n(
          'Ensure the filename not to be modified by other extensions. ' +
            'This mode might be conflicted with other download management extensions.',
          'options:integrations'
        )}
        isOn={integrationSettings.aggressiveMode}
        handleClick={toggler.aggressiveMode}
        isDisable={isInFireFox}
        message={message}
        testId="aggressiveMode-feature-switch"
      />
    </VStack>
  )
}

export default IntegrationOptions
