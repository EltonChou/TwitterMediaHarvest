import { storageConfig } from '@backend/configurations'
import StatisticsUseCases from '@backend/statistics/useCases'
import {
  Box,
  Center,
  ColorProps,
  Flex,
  HStack,
  Icon,
  IconButton,
  Link,
  Spacer,
  Stack,
  Text,
  VStack,
} from '@chakra-ui/react'
import PopupFeatureBlock from '@pages/components/PopupFeatureBlock'
import React, { memo, useCallback, useEffect, useState } from 'react'
import { BiCoffeeTogo, BiFile } from 'react-icons/bi'
import { FaGithub } from 'react-icons/fa'
import { IoMdSettings } from 'react-icons/io'
import type { IconType } from 'react-icons/lib'
import { MdOutlineSentimentDissatisfied, MdOutlineSentimentSatisfied } from 'react-icons/md'
import browser from 'webextension-polyfill'

const versionName = 'v' + browser.runtime.getManifest().version_name

const NavBar = () => {
  const settingsSize = 6
  return (
    <Flex w="100%" h="75px" p={5} align="center">
      <Spacer />
      <IconButton
        aria-label="settings"
        variant="ghost"
        bg="transparent"
        color="white"
        _hover={{ bg: 'rgba(255, 255, 255, 0.33)' }}
        _active={{ bg: 'rgba(255, 255, 255, 0.66)' }}
        icon={<Icon boxSize={settingsSize} as={IoMdSettings} />}
        onClick={() => window.open(browser.runtime.getURL('index.html'), '_blank')}
      />
    </Flex>
  )
}

const calcStats = (count: number, fix: number) => {
  const base = Math.pow(10, fix)
  return Math.round(((count + Number.EPSILON) / 1000) * base) / base
}

const Stats = () => {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const useCase = new StatisticsUseCases(storageConfig.statisticsRepo)
    useCase.getSuccessDownloadCount().then(num => setCount(num))
  }, [])

  return (
    <Box>
      <Center>
        <Text as="span" fontSize={'4rem'} fontWeight={600}>
          {count > 10000 ? calcStats(count, 1) + 'K' : count}
        </Text>
      </Center>
      <Center>
        <Text as="span" fontSize={'2rem'} m={0} lineHeight={1} fontWeight={500}>
          Downloads
        </Text>
      </Center>
    </Box>
  )
}

type ReactionProps = {
  icon: IconType
  iconColor: ColorProps['color']
  name: string
}

const Reaction = (props: ReactionProps) => (
  <HStack>
    <Icon color={props.iconColor} boxSize={5} as={props.icon} />
    <Text>{props.name}</Text>
  </HStack>
)

const getStoreLink = () => {
  switch (process.env.TARGET) {
    case 'firefox':
      return 'https://addons.mozilla.org/firefox/addon/media-harvest/'

    case 'edge':
      return (
        'https://microsoftedge.microsoft.com/addons/detail/' +
        'media-harvest-twitter-m/mmijhjnobkeodfgoobnlmnpjllmlibkb'
      )

    default:
      return 'https://chrome.google.com/webstore/detail/media-harvest-twitter-med/hpcgabhdlnapolkkjpejieegfpehfdok'
  }
}

const ReactionsBlock = () => {
  const storeLink = getStoreLink()
  return (
    <Box fontSize={'lg'}>
      <Link href={storeLink} target="_blank">
        <Reaction name={'Rate it!'} iconColor="rgb(0, 186, 124)" icon={MdOutlineSentimentSatisfied} />
      </Link>
      <Link href={'https://github.com/EltonChou/TwitterMediaHarvest/issues'} target="_blank">
        <Reaction name={'Report issues'} iconColor="#DD277E" icon={MdOutlineSentimentDissatisfied} />
      </Link>
    </Box>
  )
}

type FooterActionButtonProps = {
  icon: IconType
  label: string
  info: string
  link: `https://${string}`
  setInfo: (info: string) => void
  infoReseter: () => void
}

const FooterActionButton = memo((props: FooterActionButtonProps) => {
  return (
    <IconButton
      aria-label={props.label}
      variant="ghost"
      bg="transparent"
      borderRadius="0"
      _hover={{ bg: 'rgba(0, 0, 0, 0.33)' }}
      _active={{ bg: 'rgba(0, 0, 0, 0.66)' }}
      size="sm"
      color="white"
      icon={<Icon boxSize={4} as={props.icon} />}
      onMouseEnter={() => props.setInfo(props.info)}
      onMouseLeave={props.infoReseter}
      onClick={() => window.open(props.link, '_blank')}
    />
  )
})

const Footer = () => {
  const [info, setInfo] = useState(versionName)
  const resetInfo = useCallback(() => setInfo(versionName), [])
  return (
    <Flex bg="#404040" position="absolute" bottom="0" w="100%" h="50px" pl={5} pr={5} justify="center" align="center">
      <Box fontSize={'md'} ml="8px" mr="8px" color="white">
        {info}
      </Box>
      <Spacer />
      <FooterActionButton
        icon={BiFile}
        label="Change-log"
        info="Changelog"
        link="https://github.com/EltonChou/TwitterMediaHarvest"
        setInfo={setInfo}
        infoReseter={resetInfo}
      />
      <FooterActionButton
        icon={FaGithub}
        label="Github"
        info="Github"
        link="https://github.com/EltonChou/TwitterMediaHarvest"
        setInfo={setInfo}
        infoReseter={resetInfo}
      />
      <FooterActionButton
        icon={BiCoffeeTogo}
        label="Donate"
        info="Buy me a coffee!"
        link="https://ko-fi.com/eltonhy"
        setInfo={setInfo}
        infoReseter={resetInfo}
      />
    </Flex>
  )
}

const Popup = () => {
  const featureP = '50px'
  return (
    <>
      <NavBar />
      <Stack spacing={4} height="375">
        <Stats />
        <PopupFeatureBlock spacing={2.5} justify="center" flex={1} pl={featureP} pr={featureP} fontSize={'lg'} />
        <VStack align={'center'} flex="1">
          <ReactionsBlock />
        </VStack>
      </Stack>
      <Footer />
    </>
  )
}

export default Popup
