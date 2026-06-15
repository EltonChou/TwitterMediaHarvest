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
import {
  Button,
  HStack,
  Icon,
  Link,
  Skeleton,
  Stack,
  Text,
} from '@chakra-ui/react'
import { metrics } from '@sentry/browser'
import type { JSX } from 'react'
import React, { memo, useState } from 'react'
import { FaBroom, FaCheck, FaXmark } from 'react-icons/fa6'

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
        name={i18n('Report issues', 'options:about')}
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

type ActionsProps = {
  cleanCache: () => Promise<UnsafeTask>
}

type CleanState = 'idle' | 'processing' | 'success' | 'failed'

const cleanStateIcon: Record<Exclude<CleanState, 'processing'>, JSX.Element> = {
  idle: <Icon as={FaBroom} />,
  success: <Icon as={FaCheck} color={'brand.green'} />,
  failed: <Icon as={FaXmark} color={'brand.red'} />,
}

const CleanCacheButton = ({ cleanCache }: ActionsProps) => {
  const [state, setState] = useState<CleanState>('idle')

  const handleClick = async () => {
    if (__METRICS__) metrics.count('page.action.clean_cache.invoked', 1)
    setState('processing')
    const error = await cleanCache()
    /* eslint-disable no-console */
    if (error) console.error(error)
    else console.info('Clean tweet cache by user.')
    /* eslint-enable no-console */
    if (__METRICS__)
      metrics.count(
        `page.action.clean_cache.${error ? 'failed' : 'success'}`,
        1
      )
    setState(error ? 'failed' : 'success')
  }

  return (
    <Button
      colorScheme="gray"
      onClick={handleClick}
      isLoading={state === 'processing'}
      leftIcon={
        state === 'processing' ? undefined : (
          <span data-testid="clean-cache-state-icon" data-state={state}>
            {cleanStateIcon[state]}
          </span>
        )
      }
      data-testid="clean-cache-btn"
    >
      {i18n('Clean Cache', 'options:about')}
    </Button>
  )
}

const Actions = ({ cleanCache }: ActionsProps) => (
  <HStack>
    <CleanCacheButton cleanCache={cleanCache} />
  </HStack>
)

type AboutProps = {
  clientRepo: IClientRepository
} & ActionsProps

const About = ({ clientRepo, cleanCache }: AboutProps) => {
  return (
    <Stack p={'1.5rem'} spacing={10}>
      <ExtensionInformation clientRepo={clientRepo} />
      <Actions cleanCache={cleanCache} />
      <Links />
    </Stack>
  )
}

export default About
