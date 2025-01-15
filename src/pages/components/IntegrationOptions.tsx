import type { ISettingsRepository } from '#domain/repositories/settings'
import type { IWarningSettingsRepo } from '#domain/repositories/warningSettings'
import { isFirefox } from '#helpers/runtime'
import { getText as i18n } from '#libs/i18n'
import useDownloadSettings from '#pages/hooks/useDownloadSettings'
import useWarningSettings from '#pages/hooks/useWarningSettings'
import Links from '#pages/links'
import { testIdProps } from '#pages/utils'
import type { DownloadSettings } from '#schema'
import type { HelperMessage } from './controls/featureControls'
import { RichFeatureSwitch } from './controls/featureControls'
import { Link, VStack } from '@chakra-ui/react'
import React from 'react'

const Aria2Description = () => {
  const aria2Ext = i18n('Aria2-Explorer', 'options:integrations')
  const full = i18n(
    'Transfer the download to Aria2 via {{aria2-extension}}.',
    'options:integrations',
    { 'aria2-extension': aria2Ext }
  )

  if (process.env.TARGET === 'firefox') return <>{full}</>

  const [prefix, suffix] = full.split(aria2Ext)
  return (
    <>
      {prefix}
      <Link
        href={Links.aria2Explorer}
        target="_blank"
        color={'blue.400'}
        {...testIdProps('aria2-ext-link')}
      >
        {aria2Ext}
      </Link>
      {suffix}
    </>
  )
}

type IntegrationOptionsProps = {
  downloadSettingsRepo: ISettingsRepository<DownloadSettings>
  warningSettingsRepo: IWarningSettingsRepo
}

/**
 * Some switches is disabled when `process.env.TARGET` is `firefox`.
 */
const IntegrationOptions = (props: IntegrationOptionsProps) => {
  const { settings: integrationSettings, toggler: downloadSettingsToggler } =
    useDownloadSettings(props.downloadSettingsRepo)
  const { settings: warningSettings, toggler: warningSettingsToggler } =
    useWarningSettings(props.warningSettingsRepo)
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
        handleClick={downloadSettingsToggler.enableAria2}
        isDisable={isInFireFox}
        message={message}
        testId="dispatchToAria2-integration-switch"
      />
      <RichFeatureSwitch
        name={i18n('Aggressive Mode', 'options:integrations')}
        desc={i18n(
          'Ensure the filename not to be modified by other extensions. This mode might be conflicted with other download management extensions.',
          'options:integrations'
        )}
        isOn={integrationSettings.aggressiveMode}
        handleClick={downloadSettingsToggler.aggressiveMode}
        isDisable={isInFireFox}
        message={message}
        testId="aggressiveMode-integration-switch"
      />
      <RichFeatureSwitch
        name={i18n('Filename Detector', 'options:integrations')}
        desc={i18n(
          'The detector can notify user when the filename is modified by other extensions.',
          'options:integrations'
        )}
        isOn={warningSettings.ignoreFilenameOverwritten}
        handleClick={warningSettingsToggler.ignoreFilenameOverwritten}
        isDisable={isInFireFox}
        message={message}
        testId="filenameDetector-integration-switch"
      />
    </VStack>
  )
}

export default IntegrationOptions
