import React from 'react'

import { Link, Stack, Text } from '@chakra-ui/react'
import ExtLinks from '@pages/links'
import browser from 'webextension-polyfill'

const ProductInformation = () => {
  return (
    <Stack>
      <Text fontSize={'1.5em'}>{browser.runtime.getManifest().name}</Text>
      <Text color={'gray.400'}>Version {browser.runtime.getManifest().version_name}</Text>
    </Stack>
  )
}

const Links = () => {
  return (
    <Stack>
      <Link isExternal referrerPolicy="no-referrer" href={ExtLinks.website}>
        Official website
      </Link>
      <Link isExternal referrerPolicy="no-referrer" href={ExtLinks.privacy}>
        Privacy policy
      </Link>
      <Link isExternal referrerPolicy="no-referrer" href={ExtLinks.changelog}>
        Changelog
      </Link>
      <Link isExternal referrerPolicy="no-referrer" href={ExtLinks.github}>
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
