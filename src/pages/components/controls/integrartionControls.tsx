import { ExternalLinkIcon } from '@chakra-ui/icons'
import { FormLabel, Link, Switch } from '@chakra-ui/react'
import React from 'react'
import browser from 'webextension-polyfill'

type IntegrationControlProps = {
  isOn: boolean
  isDisabled: boolean
  handleChange: () => void
}

export const Aria2Control = ({ isOn, handleChange, isDisabled }: IntegrationControlProps) => {
  const controlId = 'pass-to-aria2'
  const aria2Link =
    process.env.TARGET === 'chrome'
      ? 'https://chrome.google.com/webstore/detail/' + 'mpkodccbngfoacfalldjimigbofkhgjn'
      : 'https://microsoftedge.microsoft.com/addons/detail/' + 'jjfgljkjddpcpfapejfkelkbjbehagbh'

  return (
    <>
      <FormLabel htmlFor={controlId} mb="0">
        Enable{' '}
        <Link href={aria2Link} color="teal.500" isExternal>
          Aria2 Explorer <ExternalLinkIcon mx="2px" />
        </Link>
        capturing
      </FormLabel>
      <Switch id={controlId} isChecked={isOn} onChange={handleChange} disabled={isDisabled} />
    </>
  )
}

export const AggressiveModeControl = ({ isOn, handleChange, isDisabled }: IntegrationControlProps) => {
  const controlId = 'aggressive-mode'
  return (
    <>
      <FormLabel htmlFor={controlId} mb="0">
        {browser.i18n.getMessage('aggressiveMode')}
      </FormLabel>
      <Switch id={controlId} isChecked={isOn} onChange={handleChange} disabled={isDisabled} />
    </>
  )
}
