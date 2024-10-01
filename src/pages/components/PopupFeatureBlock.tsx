import type { ISettingsRepository } from '#domain/repositories/settings'
import useFeatureSettings from '#pages/hooks/useFeatureSettings'
import useLocaleVariables from '#pages/hooks/useLocaleVariables'
import { i18n } from '#pages/utils'
import type { FeatureSettings } from '#schema'
import { FeatureSwitch } from './controls/featureControls'
import { Stack } from '@chakra-ui/react'
import React, { memo } from 'react'

export type PopupFeatureBlockProps = {
  featureSettingsRepo: ISettingsRepository<FeatureSettings>
}

const PopupFeatureBlock = memo((props: PopupFeatureBlockProps) => {
  const localizationPadding = useLocaleVariables({ fallback: '50px', ja: '40px' })
  const [featureSettings, toggler] = useFeatureSettings(props.featureSettingsRepo)

  return (
    <Stack
      direction={'column'}
      spacing={3}
      justify="center"
      flex={1}
      pl={localizationPadding}
      pr={localizationPadding}
    >
      <FeatureSwitch
        isOn={featureSettings.autoRevealNsfw}
        handleChange={toggler.nsfw}
        labelContent={i18n('popup_features_revealNsfw')}
      />
      <FeatureSwitch
        isOn={featureSettings.includeVideoThumbnail}
        handleChange={toggler.thumbnail}
        labelContent={i18n('popup_features_downloadVideoThumbnail')}
      />
    </Stack>
  )
})

export default PopupFeatureBlock
