import './main.sass'
import * as Sentry from '@sentry/browser'
import { BrowserTracing } from '@sentry/tracing'
import { SENTRY_DSN } from '../constants'


Sentry.init({
  dsn: SENTRY_DSN,
  integrations: [new BrowserTracing()],
  ignoreErrors: [
    'ResizeObserver loop limit exceeded',
    'Extension context invalidated',
    '(intermediate value)(intermediate value)(intermediate value).querySelector is not a function'
  ],
  release: process.env.RELEASE,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.3 : 0.8,
  environment: process.env.NODE_ENV
})

import TwitterMediaObserver from './observers/TwitterMediaObserver'
import TweetDeckObserver from './observers/TweetDeckObserver'
import { isTweetDeck } from './utils/checker'
import { TweetDeckKeyboardMonitor, TwitterKeyboardMonitor } from './KeyboardMonitor'

const observer = isTweetDeck() ? new TweetDeckObserver() : new TwitterMediaObserver()
const keyboardMonitor = isTweetDeck() ? new TweetDeckKeyboardMonitor() : new TwitterKeyboardMonitor()

window.addEventListener('keydown', keyboardMonitor.handleKeyDown.bind(keyboardMonitor))
window.addEventListener('keyup', keyboardMonitor.handleKeyUp.bind(keyboardMonitor))

// Ensure observing when the tab is focused.
let hasFocused = false
window.addEventListener('focus', () => {
  observer.initialize()
  if (!hasFocused) {
    observer.observeRoot()
    hasFocused = true
  }
})

observer.observeRoot()
