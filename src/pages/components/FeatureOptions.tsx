import type { ISettingsRepository } from '#domain/repositories/settings'
import { getText as i18n } from '#libs/i18n'
import useFeatureSettings from '#pages/hooks/useFeatureSettings'
import type { FeatureSettings } from '#schema'
import DownloadKey from '../../contentScript/KeyboardMonitor/DownloadKey'
import { RichFeatureSwitch } from './controls/featureControls'
import { Kbd, Text, VStack } from '@chakra-ui/react'
import React from 'react'

const getKey = (downloadKey: DownloadKey): string => downloadKey.slice(-1)

const KeyboardShortcutDesc = () => {
  return (
    <Text as={'span'}>
      {i18n('Use keyboard shortcut to trigger download.', 'options:features')}
      <br />
      <Text as={'span'}>
        Twitter: <Kbd>{getKey(DownloadKey.Twitter)}</Kbd>
      </Text>
      <br />
      <Text as={'span'}>
        TweetDeck: <Kbd>{getKey(DownloadKey.BetaTweetDeck)}</Kbd>
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
        name={i18n('Auto-reveal sensitive content', 'options:features')}
        desc={i18n(
          'When the tweet was flagged as sensitive content, this feature can show the blured content automatically.',
          'options:features'
        )}
        isOn={featureSettings.autoRevealNsfw}
        handleClick={toggler.nsfw}
        testId="revealNsfw-feature-switch"
      />
      <RichFeatureSwitch
        name={i18n('Keyboard shortcut', 'options:features')}
        desc={<KeyboardShortcutDesc />}
        isOn={featureSettings.keyboardShortcut}
        handleClick={toggler.keyboardShortcut}
        testId="keyboardShortcut-feature-switch"
      />
      <RichFeatureSwitch
        name={i18n('Download video thumbnail', 'options:features')}
        desc={i18n(
          'Download the thumbnail when the media is video.',
          'options:features'
        )}
        isOn={featureSettings.includeVideoThumbnail}
        handleClick={toggler.thumbnail}
        testId="videoThumbnail-feature-switch"
      />
    </VStack>
  )
}

export default FeatureOptions
