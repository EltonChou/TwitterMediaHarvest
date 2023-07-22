/* eslint-disable react-hooks/rules-of-hooks */
import { init as SentryInit, setUser } from '@sentry/browser'
import Browser from 'webextension-polyfill'
// import { BrowserTracing } from '@sentry/tracing'
import { Action } from '../enums'
import './main.sass'

SentryInit({
  dsn: process.env.SENTRY_DSN,
  // integrations: [new BrowserTracing()],
  ignoreErrors: [
    'abs.twimg.com',
    'ApiError',
    'ResizeObserver loop completed with undelivered notifications.',
    'ResizeObserver loop limit exceeded',
    'Extension context invalidated',
    '(intermediate value)(intermediate value)(intermediate value).querySelector is not a function',
    'Error: A listener indicated an asynchronous response by returning true',
    'The message port closed before a response was received.',
    // eslint-disable-next-line quotes
    "reading 'sendMessage'",
    'Could not establish connection. Receiving end does not exist.',
    /abs\.twimg\.com/,
  ],
  denyUrls: [/abs\.twimg\.com/, /browser-polyfill/],
  release: process.env.RELEASE,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.3 : 0.8,
  environment: process.env.NODE_ENV,
})

Browser.runtime.sendMessage({ action: Action.FetchUser }).then(user => setUser(user))

import { FeaturesRepository } from './features/repository'
import { TweetDeckBetaKeyboardMonitor, TweetDeckLegacyKeyboardMonitor, TwitterKeyboardMonitor } from './KeyboardMonitor'
import TweetDeckBetaObserver from './observers/TweetDeckBetaObserver'
import TweetDeckLegacyObserver from './observers/TweetDeckLegacyObserver'
import TwitterMediaObserver from './observers/TwitterMediaObserver'
import { isBetaTweetDeck, isTwitter } from './utils/checker'

const featureRepo = new FeaturesRepository()

const useObserver = (revealNsfw: boolean) => {
  if (isTwitter()) return new TwitterMediaObserver(revealNsfw)
  if (isBetaTweetDeck()) return new TweetDeckBetaObserver(revealNsfw)
  return new TweetDeckLegacyObserver()
}

const useKeboardMonitor = () => {
  if (isTwitter()) return new TwitterKeyboardMonitor()
  if (isBetaTweetDeck()) return new TweetDeckBetaKeyboardMonitor()
  return new TweetDeckLegacyKeyboardMonitor()
}

featureRepo.isEnableKeyboardShortcut().then(isMonitorKB => {
  if (!isMonitorKB) return
  const kbMonitor = useKeboardMonitor()
  window.addEventListener('keyup', e => kbMonitor.handleKeyUp(e))
  window.addEventListener('keydown', e => kbMonitor.handleKeyDown(e))
})

let hasFocused = false

featureRepo
  .isRevealNsfw()
  .then(revealNsfw => useObserver(revealNsfw))
  .then(observer => {
    // Ensure observing when the tab is focused.
    window.addEventListener('focus', () => {
      observer.initialize()
      if (!hasFocused) {
        observer.observeRoot()
        hasFocused = true
      }
    })

    observer.observeRoot()
  })
