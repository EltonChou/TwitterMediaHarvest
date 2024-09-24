import type { IClientRepository } from '#domain/repositories/client'
import useClient from '#pages/hooks/useClient'
import ExtLinks from '#pages/links'
import { i18n } from '#pages/utils'
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
        {i18n('options_about_version')} {getFullVersion()}
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
        name={i18n('options_about_officialWebsite')}
        href={ExtLinks.website}
      />
      <ExternalLink name={i18n('options_about_privacyPolicy')} href={ExtLinks.privacy} />
      <ExternalLink name={i18n('options_about_issues')} href={ExtLinks.issues} />
      <ExternalLink name={i18n('options_about_changeLog')} href={ExtLinks.changelog} />
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
