import React from 'react'

import { HStack, Kbd, Text, VStack } from '@chakra-ui/react'
import useFeatureSettings from '@pages/hooks/useFeatureSettings'
import { i18n } from '@pages/utils'
import { RichFeatureSwitch } from './controls/featureControls'

const KeyboardShortcutDesc = () => {
  return (
    <>
      {i18n('options_features_keyboardShortcut_desc')}
      <HStack>
        <Text>
          twitter: <Kbd>D</Kbd>
        </Text>
        <Text>
          tweetdeck: <Kbd>O</Kbd>
        </Text>
      </HStack>
    </>
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
