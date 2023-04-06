import { Container, Flex, Heading, Stack } from '@chakra-ui/react'
import FeatureOptions from '@pages/components/FeatureOptions'
import IntegrationOptions from '@pages/components/IntegrationOptions'
import GeneralOptions from '@pages/components/GeneralOptions'
import SideMenu from '@pages/components/SideMenu'
import React from 'react'
import { HashRouter, Route, Routes } from 'react-router-dom'

type ContentProps = {
  title: string
  children?: JSX.Element
}

const Content = (props: ContentProps) => {
  return (
    <Container fontSize={{ base: 'md', lg: 'lg' }} pt={10}>
      <Stack>
        <Heading p={'1.5rem'}>{props.title}</Heading>
        {props.children}
      </Stack>
    </Container>
  )
}

const App = () => {
  return (
    <Flex height="full">
      <HashRouter>
        <SideMenu />
        <Routes>
          <Route
            path="/"
            element={
              <Content title="General">
                <GeneralOptions />
              </Content>
            }
          />
          <Route
            path="/features"
            element={
              <Content title="Features">
                <FeatureOptions />
              </Content>
            }
          />
          <Route
            path="/integrations"
            element={
              <Content title="Integrations">
                <IntegrationOptions />
              </Content>
            }
          />
          <Route path="/history" element={<Content title="History" />} />
          <Route path="/statistics" element={<Content title="Statistics" />} />
          <Route path="/about" element={<Content title="About" />} />
        </Routes>
      </HashRouter>
    </Flex>
  )
}

export default App
