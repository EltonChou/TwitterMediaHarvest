/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import makeHarvester from '../core'
import { articleHasMedia } from '../utils/article'
import { isInTweetStatus } from '../utils/checker'
import { revealNsfw } from '../utils/helper'
import observeElement from './observer'
import { $, $$, elementExists } from 'select-dom'

const _isColumnLoaded = () =>
  !elementExists(
    '[data-testid*="multi-column-layout-column-content"] [role="progressbar"]'
  )

export default class TweetDeckBetaObserver implements IHarvestObserver {
  constructor(public autoRevealNsfw: boolean) {}

  initialize() {
    const modalQuery = '[aria-labelledby="modal-header"]'
    const modal = $(modalQuery)
    if (
      modal &&
      isInTweetStatus() &&
      !elementExists('[aria-label="Loading"]')
    ) {
      makeHarvester(modal)
    }

    $$('article').forEach(article => {
      if (this.autoRevealNsfw) revealNsfw(article)
      if (articleHasMedia(article)) makeHarvester(article)
    })
  }

  observeModal() {
    const options: MutationObserverInit = {
      childList: true,
      subtree: true,
    }

    const modalMutationCallback: MutationCallback = () => {
      this.initialize()
    }

    observeElement('modal', '#layers', modalMutationCallback, options)
  }

  observeRoot() {
    const options: MutationObserverInit = {
      childList: true,
      subtree: true,
    }

    const rootMutationCallback: MutationCallback = () => {
      // TODO: When to disconnect the observer?
      this.initialize()
      this.observeStream()
      this.observeModal()
      this.observeColumns()
    }

    observeElement('root', '#react-root', rootMutationCallback, options)
  }

  observeStream() {
    const mutaionCb: MutationCallback = mutations => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (!(node instanceof HTMLElement)) return

          const article = $('article', node)
          if (!article) return
          if (this.autoRevealNsfw) revealNsfw(article)
          if (articleHasMedia(article)) makeHarvester(article)
        })
      })
    }

    const streams = $$(
      '[data-testid="multi-column-layout-column-content"] > section[role="region"] > div[aria-label] > div'
    )
    streams.forEach(stream => {
      observeElement('Stream', stream, mutaionCb)
    })
  }

  observeColumns() {
    const cb: MutationCallback = mutations => {
      mutations.forEach(mutation => {
        if (mutation.addedNodes.length) this.observeStream()
      })
    }

    observeElement('Columns', 'main[role="main"] > div > div > div', cb, {
      childList: true,
    })
  }
}
