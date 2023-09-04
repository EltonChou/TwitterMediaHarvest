import React, { useEffect, useState } from 'react'

import { clientInfoRepo } from '@backend/configurations'
import { Link, Stack, Text } from '@chakra-ui/react'
import ExtLinks from '@pages/links'
import { i18n } from '@pages/utils'
import browser from 'webextension-polyfill'

const ProductInformation = () => {
  const [clientUuid, setClientUuid] = useState('xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx')

  useEffect(() => {
    clientInfoRepo.getInfo().then(info => {
      setClientUuid(info.uuid)
    })
  }, [])

  return (
    <Stack>
      <Text fontSize={'1.5em'}>{browser.runtime.getManifest().name}</Text>
      <Text fontSize={'sm'} color={'gray.500'}>
        {clientUuid}
      </Text>
      <Text color={'gray.400'}>
        {i18n('options_about_version')} {browser.runtime.getManifest().version_name}
      </Text>
    </Stack>
  )
}

const Links = () => {
  return (
    <Stack>
      <Link isExternal referrerPolicy="no-referrer" href={ExtLinks.website} textTransform={'capitalize'}>
        {i18n('options_about_officialWebsite')}
      </Link>
      <Link isExternal referrerPolicy="no-referrer" href={ExtLinks.privacy} textTransform={'capitalize'}>
        {i18n('options_about_privacyPolicy')}
      </Link>
      <Link isExternal referrerPolicy="no-referrer" href={ExtLinks.issues} textTransform={'capitalize'}>
        {i18n('options_about_issues')}
      </Link>
      <Link isExternal referrerPolicy="no-referrer" href={ExtLinks.changelog} textTransform={'capitalize'}>
        {i18n('options_about_changeLog')}
      </Link>
      <Link isExternal referrerPolicy="no-referrer" href={ExtLinks.github} textTransform={'capitalize'}>
        Github
      </Link>
    </Stack>
  )
}

const About = () => {
  return (
    <Stack p={'1.5rem'} spacing={10}>
      <ProductInformation />
      <Links />
    </Stack>
  )
}

export default About
