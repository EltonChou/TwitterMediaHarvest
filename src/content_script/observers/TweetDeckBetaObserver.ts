import select from 'select-dom'
import makeHarvester from '../core'
import { articleHasMedia, isInTweetStatus } from '../utils/checker'
import observeElement from './observer'

const isColumnLoaded = () => !select.exists('[data-testid*="multi-column-layout-column-content"] [role="progressbar"]')

const revealNsfw = (article: HTMLElement) => {
  if (!article || article.dataset['autoReveal']) return
  const revealButton = select('[style*="blur"]', article)
  if (revealButton) {
    article.dataset['autoReveal'] = 'true'
    revealButton.click()
  }
}

export default class TweetDeckBetaObserver implements HarvestObserver {
  constructor(public autoRevealNsfw: boolean) {}

  initialize() {
    const modalQuery = '[aria-labelledby="modal-header"]'
    if (select.exists(modalQuery) && isInTweetStatus()) {
      const modal = select(modalQuery)
      if (!select.exists('[aria-label="Loading"]')) makeHarvester(modal)
    }

    const articles = select.all('article')
    for (const article of articles) {
      if (this.autoRevealNsfw) revealNsfw(article)
      if (articleHasMedia(article)) makeHarvester(article)
    }
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

    const rootMutationCallback: MutationCallback = (_, observer) => {
      this.initialize()
      this.observeStream()
      this.observeModal()
    }

    observeElement('root', '#react-root', rootMutationCallback, options)
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

    const streams = select.all('section[role="region"] > div[aria-label] > div')

    streams.forEach(stream => {
      observeElement('stream', stream, mutaionCb)
    })
  }
}
