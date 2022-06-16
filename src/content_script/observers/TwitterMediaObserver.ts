import select from 'select-dom'
import makeHarvester from '../core'
import observeElement from './observer'
import { articleHasMedia, isStreamLoaded } from '../utils/checker'

enum Query {
  Root = '#react-root > div > div',
  Stream = 'section[role="region"] > div[aria-label] > div',
  Modal = '[aria-labelledby="modal-header"]',
  ModalWrapper = '#layers',
  ModalThread = '[aria-labelledby="modal-header"] [aria-expanded="true"]',
}

export default class TwitterMediaObserver implements HarvestObserver {
  observeRoot() {
    const options: MutationObserverInit = {
      childList: true,
      subtree: true,
    }

    const rootMutationCallback: MutationCallback = (_, observer) => {
      this.initialize()
      if (isStreamLoaded()) {
        this.observeTitle()
        this.observeModal()
        this.observeStream()
        observer.disconnect()
      }
    }
    observeElement(Query.Root, rootMutationCallback, options)
  }

  initialize() {
    if (select.exists(Query.Modal)) {
      const modal = select(Query.Modal)
      makeHarvester(modal)
    }

    const articles = select.all('article')
    for (const article of articles) {
      if (articleHasMedia(article)) makeHarvester(article)
    }
  }

  observeStream() {
    observeElement(Query.Stream, mutations => {
      for (const mutation of mutations) {
        for (const addedNode of mutation.addedNodes) {
          const article = select('article', addedNode as ParentNode)
          if (articleHasMedia(article)) makeHarvester(article)
        }
      }
    })
  }

  observeTitle() {
    const options: MutationObserverInit = {
      childList: true,
      characterData: true,
    }

    const titleMutationCallback: MutationCallback = (_, observer) => {
      this.observeRoot()
      observer.disconnect()
    }
    observeElement('title', titleMutationCallback, options)
  }

  observeModal() {
    const options: MutationObserverInit = {
      childList: true,
      subtree: true,
    }

    const threadCallback: MutationCallback = (_, observer) => {
      this.initialize()
      observer.disconnect()
    }

    const modalMutationCallback: MutationCallback = () => {
      this.initialize()
      const modalThread = select(Query.ModalThread)

      if (modalThread) {
        observeElement(modalThread, threadCallback)
      }
    }

    observeElement(Query.ModalWrapper, modalMutationCallback, options)
  }
}
