import select from 'select-dom'
import makeHarvester from '../core'
import { articleHasMedia, isStreamLoaded } from '../utils/checker'
import observeElement from '../utils/observer'

const query = Object.freeze({
  root: '#react-root > div > div',
  stream: 'section[role="region"] > div > div',
  modal: '[aria-labelledby="modal-header"]',
  modalWrapper: '#layers',
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

    const threadCallback = (_, observer) => {
      this.initialize()
      observer.disconnect()
    }

    /**
     * @type {MutationCallback}
     */
    const modalMutationCallback = () => {
      this.initialize()
      const modalThread = select(query.modalThread)

      if (modalThread) {
        observeElement(modalThread, threadCallback)
      }
    }

    observeElement(query.modalWrapper, modalMutationCallback, options)
  }
}
