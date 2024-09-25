import type { ISettingsRepository } from '#domain/repositories/settings'
import useFeatureSettings from '#pages/hooks/useFeatureSettings'
import { i18n } from '#pages/utils'
import type { FeatureSettings } from '#schema'
import DownloadKey from '../../contentScript/KeyboardMonitor/DownloadKey'
import { RichFeatureSwitch } from './controls/featureControls'
import { Kbd, Text, VStack } from '@chakra-ui/react'
import React from 'react'

const KeyboardShortcutDesc = () => {
  return (
    <Text as={'span'}>
      {i18n('options_features_keyboardShortcut_desc')}
      <br />
      <Text as={'span'}>
        Twitter: <Kbd>{DownloadKey.Twitter.toUpperCase()}</Kbd>
      </Text>
      <br />
      <Text as={'span'}>
        TweetDeck: <Kbd>{DownloadKey.BetaTweetDeck.toUpperCase()}</Kbd>
      </Text>
    </Text>
  )
}

type FeatureOptionsProps = {
  featureSettingsRepo: ISettingsRepository<FeatureSettings>
}

const FeatureOptions = ({ featureSettingsRepo }: FeatureOptionsProps) => {
  const [featureSettings, toggler] = useFeatureSettings(featureSettingsRepo)

  return (
    <VStack>
      <RichFeatureSwitch
        name={i18n('options_features_revealNsfw')}
        desc={i18n('options_features_revealNsfw_desc')}
        isOn={featureSettings.autoRevealNsfw}
        handleClick={toggler.nsfw}
      />
      <RichFeatureSwitch
        name={i18n('options_features_keyboardShortcut')}
        desc={<KeyboardShortcutDesc />}
        isOn={featureSettings.keyboardShortcut}
        handleClick={toggler.keyboardShortcut}
      />
      <RichFeatureSwitch
        name={i18n('options_features_downloadVideoThumbnail')}
        desc={i18n('options_features_downloadVideoThumbnail_desc')}
        isOn={featureSettings.includeVideoThumbnail}
        handleClick={toggler.thumbnail}
      />
    </VStack>
  )
}

export default FeatureOptions
