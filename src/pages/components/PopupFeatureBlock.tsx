import type { StackProps } from '@chakra-ui/react'
import { Stack } from '@chakra-ui/react'
import useFeatureSettings from '@pages/hooks/useFeatureSettings'
import React from 'react'
import { FeatureSwitch } from './controls/featureControls'
import { i18n } from '@pages/utils'

const PopupFeatureBlock = (props: StackProps) => {
  const [featureSettings, nsfwToggler, thumbnailToggler] = useFeatureSettings()

  return (
    <Stack direction={'column'} {...props}>
      <FeatureSwitch
        isOn={featureSettings.autoRevealNsfw}
        handleChange={nsfwToggler}
        labelContent={i18n('popup_features_revealNsfw')}
      />
      <FeatureSwitch
        isOn={featureSettings.includeVideoThumbnail}
        handleChange={thumbnailToggler}
        labelContent={i18n('popup_features_downloadVideoThumbnail')}
      />
    </Stack>
  )
}

export default PopupFeatureBlock
