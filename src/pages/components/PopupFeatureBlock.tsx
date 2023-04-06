import type { StackProps } from '@chakra-ui/react'
import { Stack } from '@chakra-ui/react'
import useFeatureSettings from '@pages/hooks/useFeatureSettings'
import React from 'react'
import browser from 'webextension-polyfill'
import { FeatureSwitch } from './controls/featureControls'

const PopupFeatureBlock = (props: StackProps) => {
  const [featureSettings, nsfwToggler, thumbnailToggler] = useFeatureSettings()

  return (
    <Stack direction={'column'} {...props}>
      <FeatureSwitch
        isOn={featureSettings.autoRevealNsfw}
        handleChange={nsfwToggler}
        labelContent={browser.i18n.getMessage('autoRevealNsfwShort')}
      />
      <FeatureSwitch
        isOn={featureSettings.includeVideoThumbnail}
        handleChange={thumbnailToggler}
        labelContent={browser.i18n.getMessage('downloadVideoThumbnail')}
      />
    </Stack>
  )
}

export default PopupFeatureBlock
