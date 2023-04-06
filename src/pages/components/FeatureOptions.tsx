import React from 'react'

import { VStack } from '@chakra-ui/react'
import useFeatureSettings from '@pages/hooks/useFeatureSettings'
import { RichFeatureSwitch } from './controls/featureControls'

const FeatureOptions = () => {
  const [featureSettings, nsfwToggler, thumbnailToggler] = useFeatureSettings()

  return (
    <VStack>
      <RichFeatureSwitch
        name="Auto-reveal sensitive content"
        desc="When the tweet was flagged as sensitive content, this feature can show the blured content automatically."
        isOn={featureSettings.autoRevealNsfw}
        handleClick={nsfwToggler}
      />
      <RichFeatureSwitch
        name="Download video thumbnail"
        desc="Download the thumbnail when the media is video."
        isOn={featureSettings.includeVideoThumbnail}
        handleClick={thumbnailToggler}
      />
    </VStack>
  )
}

export default FeatureOptions
