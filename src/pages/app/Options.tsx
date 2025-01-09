import type { IClientRepository } from '#domain/repositories/client'
import type { ISettingsRepository } from '#domain/repositories/settings'
import type { SearchDownloadHistory } from '#domain/useCases/searchDownloadHistory'
import type { SearchTweetIdsByHashTags } from '#domain/useCases/searchTweetIdsByHashtags'
import type { FilenameSetting } from '#domain/valueObjects/filenameSetting'
import type { JSX } from 'react'
import { getText as i18n } from '#libs/i18n'
import About from '#pages/components/About'
import FeatureOptions from '#pages/components/FeatureOptions'
import FootBar from '#pages/components/FootBar'
import GeneralOptions from '#pages/components/GeneralOptions'
import HistoryTable from '#pages/components/History'
import IntegrationOptions from '#pages/components/IntegrationOptions'
import SideMenu from '#pages/components/SideMenu'
import { DownloadSettings, FeatureSettings } from '#schema'
import {
  Container,
  ContainerProps,
  HStack,
  Heading,
  Stack,
} from '@chakra-ui/react'
import React from 'react'
import { HashRouter, Route, Routes } from 'react-router-dom'

type ContentProps = {
  title: string
  children?: JSX.Element
  maxW?: ContainerProps['maxWidth']
}

const Content = (props: ContentProps) => {
  return (
    <Container
      fontSize={'lg'}
      pt={10}
      pb={10}
      flex={1}
      maxW={props.maxW || '80ch'}
    >
      <Stack maxH={'full'}>
        <Heading p={'1.5rem'}>{props.title}</Heading>
        {props.children}
      </Stack>
    </Container>
  )
}

type RepoProvider = {
  clientRepo: IClientRepository
  downloadSettingsRepo: ISettingsRepository<DownloadSettings>
  filenameSettingsRepo: ISettingsRepository<FilenameSetting>
  featureSettingsRepo: ISettingsRepository<FeatureSettings>
}

type UseCaseProvider = {
  searchDownloadHistory: SearchDownloadHistory
  searchTweetIdsByHashtags: SearchTweetIdsByHashTags
}

type InfraProvider = RepoProvider & UseCaseProvider

const App = ({
  clientRepo,
  downloadSettingsRepo,
  filenameSettingsRepo,
  featureSettingsRepo,
  searchDownloadHistory,
  searchTweetIdsByHashtags,
}: InfraProvider) => {
  return (
    <HStack flex={1} spacing={0} overflow={'hidden'}>
      <HashRouter>
        <SideMenu />
        <Stack flex={1} height={'full'} overflow={'auto'}>
          <Routes>
            <Route
              path="/"
              element={
                <Content title={i18n('General', 'options:sideMenu')}>
                  <GeneralOptions
                    downloadSettingsRepo={downloadSettingsRepo}
                    filenameSettingsRepo={filenameSettingsRepo}
                  />
                </Content>
              }
            />
            <Route
              path="/features"
              element={
                <Content title={i18n('Features', 'options:sideMenu')}>
                  <FeatureOptions featureSettingsRepo={featureSettingsRepo} />
                </Content>
              }
            />
            <Route
              path="/integrations"
              element={
                <Content title={i18n('Integrations', 'options:sideMenu')}>
                  <IntegrationOptions
                    downloadSettingsRepo={downloadSettingsRepo}
                  />
                </Content>
              }
            />
            <Route
              path="/history"
              element={
                <Content
                  title={i18n('History', 'options:sideMenu')}
                  maxW={'150ch'}
                >
                  <HistoryTable
                    searchDownloadHistory={searchDownloadHistory}
                    searchTweetIdsByHashtags={searchTweetIdsByHashtags}
                  />
                </Content>
              }
            />
            <Route
              path="/statistics"
              element={<Content title="Statistics" />}
            />
            <Route
              path="/about"
              element={
                <Content title={i18n('About', 'options:sideMenu')}>
                  <About clientRepo={clientRepo} />
                </Content>
              }
            />
          </Routes>
          <FootBar />
        </Stack>
      </HashRouter>
    </HStack>
  )
}

export default App
