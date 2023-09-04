import Options from './app/Options'
import Popup from './app/Popup'
import './main.sass'
import theme from './themes'
import { ChakraProvider } from '@chakra-ui/react'
import React from 'react'
import * as ReactDOMClient from 'react-dom/client'
import Browser from 'webextension-polyfill'

document.documentElement.setAttribute('lang', Browser.i18n.getUILanguage())

// Create a root.
const root = ReactDOMClient.createRoot(document.getElementById('root'))

// Initial render: Render an element to the root.
const params = new URLSearchParams(window.location.search)
const body = document.getElementsByTagName('body')[0]

switch (params.get('tab')) {
  case 'popup':
    root.render(
      <React.StrictMode>
        <ChakraProvider theme={theme}>
          <Popup />
        </ChakraProvider>
      </React.StrictMode>
    )
    break
  default:
    body.removeAttribute('style')
    root.render(
      <React.StrictMode>
        <ChakraProvider theme={theme}>
          <Options />
        </ChakraProvider>
      </React.StrictMode>
    )
    break
}

// During an update, there's no need to pass the container again.
// root.render(<App tab="profile" />)
