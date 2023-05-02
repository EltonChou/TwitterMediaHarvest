import React from 'react'

import { Kbd, Text, VStack } from '@chakra-ui/react'
import useFeatureSettings from '@pages/hooks/useFeatureSettings'
import { i18n } from '@pages/utils'
import { DownloadKey } from '../../typings'
import { RichFeatureSwitch } from './controls/featureControls'

const KeyboardShortcutDesc = () => {
  return (
    <Text as={'span'}>
      {i18n('options_features_keyboardShortcut_desc')}
      <br />
      <Text as={'span'}>
        twitter: <Kbd>{DownloadKey.Twitter}</Kbd>
      </Text>
      <br />
      <Text as={'span'}>
        TweetDeck (Legacy UI): <Kbd>{DownloadKey.LegacyTweetDeck}</Kbd>
      </Text>
      <br />
      <Text as={'span'}>
        TweetDeck (Beta UI): <Kbd>{DownloadKey.BetaTweetDeck}</Kbd>
      </Text>
    </Text>
  )
}

const FeatureOptions = () => {
  const [featureSettings, toggler] = useFeatureSettings()

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
