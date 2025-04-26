import '@testing-library/jest-dom'
import { TextDecoder, TextEncoder } from 'util'
import 'whatwg-fetch'

Object.assign(global, {
  TextDecoder,
  TextEncoder,
  __BROWSER__: 'chrome',
  __RELEASE_NAME__: 'test',
  __DEV__: false,
  __TEST__: true,
  __PROD__: false,
  __CHROME__: true,
  __FIREFOX__: false,
  __GECKO__: false,
  __EDGE__: false,
  __CHROMIUM__: true,
  __SAFARI__: false,
})

// Monkey patch for webextension-polyfill
chrome.runtime.id = 'TEST'

process.env.IDENTITY_POOL_ID = 'pool-id'
process.env.IDENTITY_POOL_REGION = 'region'
process.env.API_KEY = 'api_key'
process.env.API_HOSTNAME = 'somewhere.com'
