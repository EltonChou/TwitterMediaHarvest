import select from 'select-dom'
import makeHarvester from '../core'
import { articleHasMedia, isInTweetStatus, isStreamLoaded } from '../utils/checker'
import { revealNsfw } from '../utils/helper'
import observeElement from './observer'

enum Query {
  Root = '#react-root',
  Stream = 'section[role="region"] > div[aria-label] > div',
  Modal = '[aria-labelledby="modal-header"]',
  ModalWrapper = '#layers',
  ModalThread = '[aria-labelledby="modal-header"] [aria-expanded="true"]',
  Timeline = '[data-testid="primaryColumn"] [aria-label]',
}

export default class TwitterMediaObserver implements IHarvestObserver {
  constructor(readonly autoRevealNsfw = false) {}

  observeRoot() {
    const options: MutationObserverInit = {
      childList: true,
      subtree: true,
    }

    const rootMutationCallback: MutationCallback = (_, observer) => {
      this.initialize()
      if (isStreamLoaded()) {
        this.observeHead()
        this.observeModal()
        this.observeStream()
        this.observeHead()
        observer.disconnect()
      }
    }
    observeElement('Root', Query.Root, rootMutationCallback, options)
  }

  initialize() {
    const modal = select(Query.Modal)
    if (modal && isInTweetStatus() && select.exists('img[alt="Image"]', modal)) {
      makeHarvester(modal)
    }

    const articles = select.all('article')
    for (const article of articles) {
      if (this.autoRevealNsfw) revealNsfw(article)
      if (articleHasMedia(article)) makeHarvester(article)
    }
  }

  observeStream() {
    const mutaionCb: MutationCallback = mutations => {
      for (const mutation of mutations) {
        for (const addedNode of mutation.addedNodes) {
          const article = select('article', addedNode as ParentNode)
          if (this.autoRevealNsfw) revealNsfw(article)
          if (articleHasMedia(article)) makeHarvester(article)
        }
      }
    }

    observeElement('Stream', Query.Stream, mutaionCb)
  }

  observeTimeline() {
    observeElement(
      'timeline',
      Query.Timeline,
      () => {
        this.initialize()
      },
      { childList: true, subtree: true }
    )
  }

  observeHead() {
    const options: MutationObserverInit = {
      childList: true,
      subtree: false,
    }

    const titleMutationCallback: MutationCallback = () => {
      this.initialize()
      this.observeRoot()
      this.observeTimeline()
    }

    observeElement('Head', 'head', titleMutationCallback, options)
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
        observeElement('Modal Thread', modalThread, threadCallback)
      }
    }

    observeElement('Modal', Query.ModalWrapper, modalMutationCallback, options)
  }
}
