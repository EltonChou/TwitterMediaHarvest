import './main.sass'
import * as Sentry from '@sentry/browser'
import { BrowserTracing } from '@sentry/tracing'
import { SENTRY_DSN } from '../constants'


Sentry.init({
  dsn: SENTRY_DSN,
  integrations: [new BrowserTracing()],
  ignoreErrors: [
    'ResizeObserver loop limit exceeded'
  ],
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.3 : 0.8,
  environment: process.env.NODE_ENV
})

import select from 'select-dom'
import TwitterMediaObserver from './observers/TwitterMediaObserver'
import TwitterDeckObserver from './observers/TwitterDeckObserver'
import { isTweetDeck } from './utils/checker'

enum DownloadKey {
  Twitter = 'KeyD',
  TweetDeck = 'KeyO'
}

let currentFocusing: Element = document.activeElement
const observer: HarvestObserver = isTweetDeck() ? new TwitterDeckObserver() : new TwitterMediaObserver()
const getDownloadKeyCode = () => isTweetDeck() ? DownloadKey.TweetDeck : DownloadKey.Twitter

window.addEventListener('keydown', (e) => {
  if (e.code === getDownloadKeyCode() && e.target instanceof Element) {
    currentFocusing = isTweetDeck() ? select('.is-selected-tweet') : e.target
  }
})

window.addEventListener('keyup', (e) => {
  const buttonQuery = isTweetDeck() ? '.deck-harvester' : '.harvester'
  if (e.code === getDownloadKeyCode()) {
    if (e.target instanceof Element && currentFocusing) {
      const tweetCanBeHarvested = currentFocusing.closest('[data-harvest-article]')
      if (tweetCanBeHarvested) {
        const harvesterButton = select(buttonQuery, tweetCanBeHarvested)
        if (harvesterButton) harvesterButton.click()
      }
    }
  }
})

let hasFocused = false
window.addEventListener('focus', () => {
  observer.initialize()
  if (!hasFocused) {
    observer.observeRoot()
    hasFocused = true
  }
})

observer.observeRoot()
