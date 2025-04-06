/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import makeHarvester from '../core'
import { articleHasMedia } from '../utils/article'
import { isInTweetStatus, isStreamLoaded } from '../utils/checker'
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
          if (!(addedNode instanceof HTMLElement)) return

          const mediaBlocks = $$('li', addedNode)
          mediaBlocks.forEach(
            mediaBlock => this.autoRevealNsfw && revealNsfw(mediaBlock)
          )

          const article = $('article', addedNode)
          if (!article) return
          if (this.autoRevealNsfw) revealNsfw(article)
          if (articleHasMedia(article)) makeHarvester(article)
        }
      }
    }

    observeElement('Stream', Query.Stream, mutaionCb)
  }

  observeTimeline() {
    observeElement(
      'Timeline',
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
      const modalThread = $(Query.ModalThread)

      if (modalThread) {
        observeElement('Modal Thread', modalThread, threadCallback)
      }
    }

    observeElement('Modal', Query.ModalWrapper, modalMutationCallback, options)
  }
}
