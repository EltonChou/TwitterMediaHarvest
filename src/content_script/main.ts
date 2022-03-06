import './main.sass'
import select from 'select-dom'
import TwitterMediaObserver from './observers/TwitterMediaObserver'
import TwitterDeckObserver from './observers/TwitterDeckObserver'
import { isTweetDeck } from './utils/checker'

let currentFocusing: Element = document.activeElement
const observer: HarvestObserver = isTweetDeck() ? new TwitterDeckObserver() : new TwitterMediaObserver()

const getDownloadKey = () => isTweetDeck() ? 'o' : 'd'

window.addEventListener('keydown', (e) => {
  if (e.key === getDownloadKey() && e.target instanceof Element) {
    currentFocusing = isTweetDeck() ? select('.is-selected-tweet') : e.target
  }
})

window.addEventListener('keyup', (e) => {
  const buttonQuery = isTweetDeck() ? '.deck-harvester' : '.harvester'
  if (e.key === getDownloadKey()) {
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
