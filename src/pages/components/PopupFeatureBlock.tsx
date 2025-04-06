/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import type { ISettingsRepository } from '#domain/repositories/settings'
import { getText as i18n } from '#libs/i18n'
import useFeatureSettings from '#pages/hooks/useFeatureSettings'
import useLocaleVariables from '#pages/hooks/useLocaleVariables'
import type { FeatureSettings } from '#schema'
import { FeatureSwitch } from './controls/featureControls'
import { Stack } from '@chakra-ui/react'
import React, { memo } from 'react'

export type PopupFeatureBlockProps = {
  featureSettingsRepo: ISettingsRepository<FeatureSettings>
}

const PopupFeatureBlock = memo((props: PopupFeatureBlockProps) => {
  const localizationPadding = useLocaleVariables({
    fallback: '50px',
    ja: '40px',
  })
  const [featureSettings, toggler] = useFeatureSettings(
    props.featureSettingsRepo
  )

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
        labelContent={i18n('Auto-reveal NSFW', 'popup')}
      />
      <FeatureSwitch
        isOn={featureSettings.includeVideoThumbnail}
        handleChange={toggler.thumbnail}
        labelContent={i18n('Video thumbnail', 'popup')}
      />
    </Stack>
  )
})

export default PopupFeatureBlock
