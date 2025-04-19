import '@testing-library/jest-dom'
import { TextDecoder, TextEncoder } from 'util'

Object.assign(global, {
  TextDecoder,
  TextEncoder,
  __BROWSER__: 'chrome',
  __RELEASE_NAME__: 'test',
  __DEV__: false,
  __TEST__: true,
  __PROD__: false,
})

// Monkey patch for webextension-polyfill
chrome.runtime.id = 'TEST'

process.env.IDENTITY_POOL_ID = 'pool-id'
process.env.IDENTITY_POOL_REGION = 'region'
process.env.API_KEY = 'api_key'
process.env.API_HOSTNAME = 'somewhere.com'
process.env.API_ROOT_PATH = '/v1'
