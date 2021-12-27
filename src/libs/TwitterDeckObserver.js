import select from 'select-dom'
import makeHarvester from '../core'
import observeElement from '../utils/observer'

/**
 *
 * @param {Node} addedNode
 * @returns boolean
 */
const deckStreamHasMedia = addedNode =>
  select.exists('.media-preview', addedNode) &&
  !select.exists('.quted-tweet', addedNode)

export default class TwitterDeckObserver {
  /** @returns {void} */
  observeRoot() {
    /** @type {MutationCallback} */
    const rootCallback = (_, this_observer) => {
      if (select.exists('.app-columns')) {
        // console.log('huja')
        this.observeContent()
        this.observeModal()
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

  observeModal() {
    /** @type {MutationCallback} */
    const modalCallback = mutations => {
      for (const mutation of mutations) {
        if (mutation.addedNodes) {
          const article = select('.tweet', mutation.addedNodes[0])
          makeHarvester(article)
        }
      }
    }

    /** @type {MutationObserverInit} */
    const options = {
      childList: true,
    }

    observeElement('#open-modal', modalCallback, options)
  }
}
