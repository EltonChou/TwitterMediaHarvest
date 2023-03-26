import React from 'react'
import * as ReactDOMClient from 'react-dom/client'
import Popup from './app/Popup'
import Options from './app/Options'

// Create a root.
const root = ReactDOMClient.createRoot(document.getElementById('root'))

// Initial render: Render an element to the root.
const params = new URLSearchParams(window.location.search)
const html = document.getElementsByTagName('html')[0]

switch (params.get('tab')) {
  case 'popup':
    html.setAttribute('style', 'width:500px;height:600px;')
    root.render(<Popup />)
    break
  default:
    root.render(<Options />)
    break
}

// During an update, there's no need to pass the container again.
// root.render(<App tab="profile" />)
