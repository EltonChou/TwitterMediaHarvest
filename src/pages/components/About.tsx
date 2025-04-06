/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import type { IClientRepository } from '#domain/repositories/client'
import { getText as i18n } from '#libs/i18n'
import useClient from '#pages/hooks/useClient'
import ExtLinks from '#pages/links'
import { getFullVersion, getName } from '#utils/runtime'
import { Link, Skeleton, Stack, Text } from '@chakra-ui/react'
import React, { memo } from 'react'

type ExtensionInformationProps = {
  clientRepo: IClientRepository
}

const ExtensionInformation = ({ clientRepo }: ExtensionInformationProps) => {
  const { isLoaded, uuid } = useClient(clientRepo)

  return (
    <Stack>
      <Text fontSize={'1.5em'}>{getName()}</Text>
      <Skeleton isLoaded={isLoaded}>
        <Text fontSize={'sm'} color={'gray.500'}>
          {uuid}
        </Text>
      </Skeleton>
      <Text color={'gray.400'}>
        {i18n('Version', 'options:about')} {getFullVersion()}
      </Text>
    </Stack>
  )
}

type ExternalLinkProps = {
  name: string
  href: string
}

const ExternalLink = memo(({ name, href }: ExternalLinkProps) => (
  <Link
    isExternal
    referrerPolicy="no-referrer"
    href={href}
    textTransform={'capitalize'}
    data-testid="information-link"
  >
    {name}
  </Link>
))

const Links = () => {
  return (
    <Stack data-testid="information-links">
      <ExternalLink
        name={i18n('Official website', 'options:about')}
        href={ExtLinks.website}
      />
      <ExternalLink
        name={i18n('Privacy policy', 'options:about')}
        href={ExtLinks.privacy}
      />
      <ExternalLink
        name={i18n('Reoprt issues', 'options:about')}
        href={ExtLinks.issues}
      />
      <ExternalLink
        name={i18n('Changelog', 'options:about')}
        href={ExtLinks.changelog}
      />
      <ExternalLink name="Github" href={ExtLinks.github} />
    </Stack>
  )
}

type AboutProps = {
  clientRepo: IClientRepository
}

const About = ({ clientRepo }: AboutProps) => {
  return (
    <Stack p={'1.5rem'} spacing={10}>
      <ExtensionInformation clientRepo={clientRepo} />
      <Links />
    </Stack>
  )
}

export default About
