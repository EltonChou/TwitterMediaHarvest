import './main.sass'
import * as Sentry from '@sentry/browser'
import { BrowserTracing } from '@sentry/tracing'

Sentry.init({
  dsn: 'https://40df3cc6025d4968a6275f3aa1a6bbee@o1169684.ingest.sentry.io/6263910',
  integrations: [new BrowserTracing()],
  ignoreErrors: [
    'ResizeObserver loop limit exceeded'
  ],
  tracesSampleRate: 1.0,
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
      const tweetCanBeHarvested = currentFocusing.closest('[data-harvest-appended]')
      if (tweetCanBeHarvested) {
        const harvesterButton = select(buttonQuery, tweetCanBeHarvested)
        if (harvesterButton) harvesterButton.click()
      }
    }
  }
})

observer.observeRoot()