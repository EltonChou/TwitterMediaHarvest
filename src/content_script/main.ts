import * as Sentry from '@sentry/browser'
import { BrowserTracing } from '@sentry/tracing'
import { SENTRY_DSN } from '../constants'
import './main.sass'

Sentry.init({
  dsn: SENTRY_DSN,
  integrations: [new BrowserTracing()],
  ignoreErrors: [
    'ResizeObserver loop limit exceeded',
    'Extension context invalidated',
    '(intermediate value)(intermediate value)(intermediate value).querySelector is not a function',
    'Error: A listener indicated an asynchronous response by returning true',
    'The message port closed before a response was received.',
  ],
  release: process.env.RELEASE,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.3 : 0.8,
  environment: process.env.NODE_ENV,
})

import { TweetDeckKeyboardMonitor, TwitterKeyboardMonitor } from './KeyboardMonitor'
import TweetDeckObserver from './observers/TweetDeckObserver'
import TwitterMediaObserver from './observers/TwitterMediaObserver'
import { isTweetDeck } from './utils/checker'
import { FeaturesRepository } from './features/repository'

const featureRepo = new FeaturesRepository()

const observer = isTweetDeck() ? new TweetDeckObserver() : new TwitterMediaObserver(await featureRepo.isRevealNsfw())
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
