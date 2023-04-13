import React from 'react'

import { VStack } from '@chakra-ui/react'
import useFeatureSettings from '@pages/hooks/useFeatureSettings'
import { i18n } from '@pages/utils'
import { RichFeatureSwitch } from './controls/featureControls'

const FeatureOptions = () => {
  const [featureSettings, nsfwToggler, thumbnailToggler] = useFeatureSettings()

  return (
    <VStack>
      <RichFeatureSwitch
        name={i18n('options_features_revealNsfw')}
        desc={i18n('options_features_revealNsfw_desc')}
        isOn={featureSettings.autoRevealNsfw}
        handleClick={nsfwToggler}
      />
      <RichFeatureSwitch
        name={i18n('options_features_downloadVideoThumbnail')}
        desc={i18n('options_features_downloadVideoThumbnail_desc')}
        isOn={featureSettings.includeVideoThumbnail}
        handleClick={thumbnailToggler}
      />
    </VStack>
  )
}

export default FeatureOptions
