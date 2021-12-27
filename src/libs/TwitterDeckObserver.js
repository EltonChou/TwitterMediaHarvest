import select from 'select-dom'
import makeHarvester from '../core'
import observeElement from '../utils/observer'

/**
 *
 * @param {Node} addedNode
 * @returns boolean
 */
const deckStreamHasMedia = addedNode =>
  select.exists('.media-preview', addedNode)

export default class TwitterDeckObserver {
  /** @returns {void} */
  observeRoot() {
    /** @type {MutationCallback} */
    const rootCallback = (_, this_observer) => {
      if (select.exists('.app-columns')) {
        // console.log('huja')
        this.observeContent()
        this_observer.disconnect()
      }
    }

    /** @type {MutationObserverInit} */
    const options = {
      childList: true,
    }

    observeElement('.application', rootCallback, options)
  }

  /** @returns {void} */
  observeContent() {
    /** @type {MutationCallback} */
    const contentCallback = mutations => {
      for (const mutation of mutations) {
        for (const addedNode of mutation.addedNodes) {
          if (deckStreamHasMedia(addedNode)) {
            makeHarvester(addedNode)
          }
        }
      }
    }

    /** @type {MutationObserverInit} */
    const options = {
      childList: true,
    }

    const tweetContainers = select.all('.chirp-container')

    for (const tweetContainer of tweetContainers) {
      observeElement(tweetContainer, contentCallback, options)
    }
  }
}
