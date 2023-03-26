import { storageConfig } from '@backend/configurations'
import { FormControl, FormLabel, Switch } from '@chakra-ui/react'
import React from 'react'
import browser from 'webextension-polyfill'

export const AutoRevealNsfwControl = ({ isEnabled, handleChange }: FeatureControlProps) => {
  const handleChangeAndSaveSetting = async () => {
    await storageConfig.featureSettingsRepo.saveSettings({ autoRevealNsfw: !isEnabled })
    handleChange()
  }

  return (
    <FormControl display="flex" alignItems="center">
      <FormLabel htmlFor="auto-reveal-nsfw" mb="0">
        {browser.i18n.getMessage('autoRevealNsfw')}
      </FormLabel>
      <Switch id="auto-reveal-nsfw" isChecked={isEnabled} onChange={handleChangeAndSaveSetting} />
    </FormControl>
  )
}

export const VideoThumbnailControl = ({ isEnabled, handleChange }: FeatureControlProps) => {
  const handleChangeAndSaveSetting = async () => {
    await storageConfig.featureSettingsRepo.saveSettings({ includeVideoThumbnail: !isEnabled })
    handleChange()
  }

  return (
    <FormControl display="flex" alignItems="center">
      <FormLabel htmlFor="auto-reveal-nsfw" mb="0">
        {browser.i18n.getMessage('downloadVideoThumbnail')}
      </FormLabel>
      <Switch id="auto-reveal-nsfw" isChecked={isEnabled} onChange={handleChangeAndSaveSetting} />
    </FormControl>
  )
}
