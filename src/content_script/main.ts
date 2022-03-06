import './main.sass'
import select from 'select-dom'
import TwitterMediaObserver from './observers/TwitterMediaObserver'
import TwitterDeckObserver from './observers/TwitterDeckObserver'
import { isTweetDeck, isTwitter } from './utils/checker'

window.addEventListener('keyup', (e) => {
  if (e.key === 'd') {
    const currentFocusing = select('[data-focusvisible-polyfill]')
    if (currentFocusing) {
      const tweetCanBeHarvested = currentFocusing.closest('[data-harvest-appended]')
      if (tweetCanBeHarvested) {
        const harvesterButton = select('.harvester', tweetCanBeHarvested)
        harvesterButton.click()
      }
    }
  }
})

let observer: HarvestObserver = undefined

if (isTweetDeck()) {
  observer = new TwitterDeckObserver()
}

if (isTwitter()) {
  observer = new TwitterMediaObserver()
}

observer.observeRoot()
