import React from 'react'

import { Container, Heading, HStack, Stack } from '@chakra-ui/react'
import About from '@pages/components/About'
import FeatureOptions from '@pages/components/FeatureOptions'
import FootBar from '@pages/components/FootBar'
import GeneralOptions from '@pages/components/GeneralOptions'
import IntegrationOptions from '@pages/components/IntegrationOptions'
import SideMenu from '@pages/components/SideMenu'
import { i18n } from '@pages/utils'
import { HashRouter, Route, Routes } from 'react-router-dom'

type ContentProps = {
  title: string
  children?: JSX.Element
}

const Content = (props: ContentProps) => {
  return (
    <Container fontSize={'lg'} pt={10} pb={10} flex={1} maxW={'80ch'}>
      <Stack>
        <Heading p={'1.5rem'}>{props.title}</Heading>
        {props.children}
      </Stack>
    </Container>
  )
}

const App = () => {
  return (
    <HStack flex={1} spacing={0} overflow={'hidden'}>
      <HashRouter>
        <SideMenu />
        <Stack flex={1} height={'full'} overflow={'auto'}>
          <Routes>
            <Route
              path="/"
              element={
                <Content title={i18n('options_sidemenu_general')}>
                  <GeneralOptions />
                </Content>
              }
            />
            <Route
              path="/features"
              element={
                <Content title={i18n('options_sidemenu_features')}>
                  <FeatureOptions />
                </Content>
              }
            />
            <Route
              path="/integrations"
              element={
                <Content title={i18n('options_sidemenu_integrations')}>
                  <IntegrationOptions />
                </Content>
              }
            />
            <Route path="/history" element={<Content title="History" />} />
            <Route path="/statistics" element={<Content title="Statistics" />} />
            <Route
              path="/about"
              element={
                <Content title={i18n('options_sidemenu_about')}>
                  <About />
                </Content>
              }
            />
          </Routes>
          <FootBar
            style={{
              position: 'sticky',
              bottom: 0,
            }}
          />
        </Stack>
      </HashRouter>
    </HStack>
  )
}

export default App
