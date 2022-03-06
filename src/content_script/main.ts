import './main.sass'
import select from 'select-dom'
import TwitterMediaObserver from './observers/TwitterMediaObserver'
import TwitterDeckObserver from './observers/TwitterDeckObserver'
import { isTweetDeck, isTwitter } from './utils/checker'

window.addEventListener('keyup', (e) => {
  const isDeck = isTweetDeck()
  const downloadKey = isDeck ? 'o' : 'd'
  // const focusingQuery = isDeck ? '.is-selected-tweet' : '[data-focusvisible-polyfill]'
  const buttonQuery = isDeck ? '.deck-harvester' : '.harvester'
  if (e.key === downloadKey) {
    const currentFocusing = document.activeElement
    if (currentFocusing) {
      const tweetCanBeHarvested = currentFocusing.closest('[data-harvest-appended]')
      if (tweetCanBeHarvested) {
        const harvesterButton = select(buttonQuery, tweetCanBeHarvested)
        if (harvesterButton) harvesterButton.click()
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
