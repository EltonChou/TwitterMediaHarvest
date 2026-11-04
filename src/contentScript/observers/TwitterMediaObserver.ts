/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import makeHarvester from '../core'
import { articleHasMedia } from '../utils/article'
import {
  isAnonymousMode,
  isInTweetStatus,
  isStreamLoaded,
} from '../utils/checker'
import { revealNsfw } from '../utils/helper'
import observeElement from './observer'
import { $, $$ } from 'select-dom'

const enum Query {
  Root = '#react-root',
  Stream = 'section[role="region"] > div[aria-label] > div',
  MediaBlock = 'section[role="region"] > div[aria-label] > div li',
  Modal = '[aria-labelledby="modal-header"] > div:first-child',
  ModalWrapper = '#layers',
  ModalThread = '[aria-labelledby="modal-header"] [aria-expanded="true"]',
  // The whole column: its first labelled descendant can be the Back button
  // on a tweet page rather than the timeline.
  Timeline = '[data-testid="primaryColumn"]',
}

export default class TwitterMediaObserver implements IHarvestObserver {
  constructor(readonly autoRevealNsfw = false) {}

  observeAll() {
    this.observeHead()
    this.observeModal()
    this.observeStream()
    // Media inside an article can render after the article itself (common on
    // a directly opened tweet), and the stream observer only sees new
    // children. Watching the timeline's subtree catches that. It used to start
    // only when <head> changed, which may never happen on a direct load.
    this.observeTimeline()
  }

  #initializeScheduled = false
  /** Coalesces bursts of mutations into one `initialize` per frame. */
  private scheduleInitialize() {
    if (this.#initializeScheduled) return
    this.#initializeScheduled = true
    requestAnimationFrame(() => {
      this.#initializeScheduled = false
      this.initialize()
    })
  }

  observeRoot() {
    const options: MutationObserverInit = {
      childList: true,
      subtree: true,
    }

    const rootMutationCallback: MutationCallback = (_, observer) => {
      if (__DEV__) console.info('root mutation')

      this.initialize()
      if (isStreamLoaded()) {
        this.observeAll()
        observer.disconnect()
      }
    }

    const root = isAnonymousMode()
      ? $('.contents [itemscope] [itemtype$="ProfilePage"]')
      : $(Query.Root) // For anonymous mode
    if (root) observeElement('Root', root, rootMutationCallback, options)
    if (!root) {
      this.initialize()
      this.observeAll()
    }
  }

  initialize() {
    const modal = $(Query.Modal)
    if (modal && isInTweetStatus()) makeHarvester(modal)

    const articles = $$('article')
    for (const article of articles) {
      if (this.autoRevealNsfw) revealNsfw(article)
      if (articleHasMedia(article)) makeHarvester(article)
    }

    const mediaBlocks = $$(Query.MediaBlock)
    mediaBlocks.forEach(b => this.autoRevealNsfw && revealNsfw(b))
  }

  observeStream() {
    const mutaionCb: MutationCallback = mutations => {
      for (const mutation of mutations) {
        for (const addedNode of mutation.addedNodes) {
          // `continue`, not `return`: one batch can hold several cells, and
          // returning skipped every cell after the first non-tweet one.
          if (!(addedNode instanceof HTMLElement)) continue

          const mediaBlocks = $$('li', addedNode)
          mediaBlocks.forEach(
            mediaBlock => this.autoRevealNsfw && revealNsfw(mediaBlock)
          )

          const article = $('article', addedNode)
          if (!article) continue
          if (this.autoRevealNsfw) revealNsfw(article)
          if (articleHasMedia(article)) makeHarvester(article)
        }
      }
    }

    const streamContainer = isAnonymousMode()
      ? $('article')?.closest('ul')
      : $(Query.Stream)
    if (streamContainer) observeElement('Stream', streamContainer, mutaionCb)
  }

  observeTimeline() {
    observeElement(
      'Timeline',
      Query.Timeline,
      () => this.scheduleInitialize(),
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
      const modalThread = $(Query.ModalThread)

      if (modalThread) {
        observeElement('Modal Thread', modalThread, threadCallback)
      }
    }

    observeElement('Modal', Query.ModalWrapper, modalMutationCallback, options)
  }
}
