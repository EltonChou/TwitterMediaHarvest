import select from 'select-dom'
import makeHarvester from '../core'
import { articleHasMedia, isStreamLoaded } from '../utils/checker'
import observeElement from '../utils/observer'

const query = Object.freeze({
  root: '#react-root > div > div',
  stream: 'section[role="region"] > div > div > div',
  modal: '[aria-labelledby="modal-header"]',
  modalWrapper:
    '#react-root > div > div > div.r-1d2f490.r-u8s1d.r-zchlnj.r-ipm5af.r-184en5c',
  modalThread: '[aria-labelledby="modal-header"] [aria-expanded="true"]',
})

export default class TwitterMediaObserver {
  /**
   * @returns {void}
   */
  observeRoot() {
    /**
     * @type {MutationObserverInit}
     */
    const options = {
      childList: true,
      subtree: true,
    }

    /**
     * @type {MutationCallback}
     */
    const rootMutationCallback = (_, observer) => {
      if (isStreamLoaded()) {
        this.initialize()
        this.observeTitle()
        this.observeModal()
        this.observeStream()
        observer.disconnect()
      }
    }
    observeElement(query.root, rootMutationCallback, options)
  }

  /**
   * @returns {void}
   */
  initialize() {
    if (select.exists(query.modal)) {
      const modal = select(query.modal)
      makeHarvester(modal)
    }

    const articles = select.all('article')
    for (const article of articles) {
      if (articleHasMedia(article)) makeHarvester(article)
    }
  }

  /**
   * @returns {void}
   */
  observeStream() {
    observeElement(query.stream, mutations => {
      for (const mutation of mutations) {
        for (const addedNode of mutation.addedNodes) {
          const article = select('article', addedNode)
          if (articleHasMedia(article)) makeHarvester(article)
        }
      }
    })
  }

  /**
   * @returns {void}
   */
  observeTitle() {
    /**
     * @type {MutationObserverInit}
     */
    const options = {
      childList: true,
      characterData: true,
    }

    /**
     * @type {MutationCallback}
     */
    const titleMutationCallback = (_, observer) => {
      this.observeRoot()
      observer.disconnect()
    }
    observeElement('title', titleMutationCallback, options)
  }

  /**
   * @returns {void}
   */
  observeModal() {
    /**
     * @type {MutationObserverInit}
     */
    const options = {
      childList: true,
      subtree: true,
    }

    /**
     * @type {MutationCallback}
     */
    const modalMutationCallback = (_, observer) => {
      const modalThread = select(query.modalThread)
      if (modalThread) {
        observeElement(modalThread, function() {
          this.initialize()
          observer.disconnect()
        })
      }
    }

    observeElement(query.modalWrapper, modalMutationCallback, options)
  }
}
