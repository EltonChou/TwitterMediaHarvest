import * as mockChrome from 'jest-chrome'

Object.assign(global, mockChrome)

// Monkey patch for webextension-polyfill
chrome.runtime.id = 'TEST'
