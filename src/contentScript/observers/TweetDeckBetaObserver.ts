import makeHarvester from '../core'
import { articleHasMedia } from '../utils/article'
import { isInTweetStatus } from '../utils/checker'
import { revealNsfw } from '../utils/helper'
import observeElement from './observer'
import select from 'select-dom'

const isColumnLoaded = () =>
  !select.exists(
    '[data-testid*="multi-column-layout-column-content"] [role="progressbar"]'
  )

export default class TweetDeckBetaObserver implements IHarvestObserver {
  constructor(public autoRevealNsfw: boolean) {}

  initialize() {
    const modalQuery = '[aria-labelledby="modal-header"]'
    const modal = select(modalQuery)
    if (modal && isInTweetStatus() && !select.exists('[aria-label="Loading"]')) {
      makeHarvester(modal)
    }

    select.all('article').forEach(article => {
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

          const article = select('article', node)
          if (!article) return
          if (this.autoRevealNsfw) revealNsfw(article)
          if (articleHasMedia(article)) makeHarvester(article)
        })
      })
    }

    const streams = select.all(
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
