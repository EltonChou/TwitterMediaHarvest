import select from 'select-dom'
import observeElement from './observer'
import makeHarvester from '../core'

const deckStreamHasMedia = (addedNode: ParentNode) => {
  const hasMedia =
    select.exists('.media-preview', addedNode) ||
    select.exists('[rel="mediaPreview"]', addedNode) ||
    select.exists('.media-preview-container', addedNode)

  const notQuoted = !select.exists('.quoted-tweet', addedNode)

  const notYoutube = !select.exists('[rel="mediaPreview"][href*="youtube.com"]', addedNode)

  return hasMedia && notQuoted && notYoutube
}

const processRootTweets = () => {
  const rootTweets = select.all('article.stream-item')
  for (const tweet of rootTweets) {
    if (deckStreamHasMedia(tweet)) makeHarvester(tweet)
  }
}

const observeDetailReplies = (replies: HTMLElement) => {
  const options: MutationObserverInit = {
    childList: true,
  }

  const repliesCallback: MutationCallback = mutations => {
    for (const mutation of mutations) {
      processRootTweets()
      for (const addedNode of mutation.addedNodes) {
        if (deckStreamHasMedia(addedNode as ParentNode)) {
          makeHarvester(addedNode as HTMLElement)
        }
      }
    }
  }

  observeElement('Replies', replies, repliesCallback, options)
}

const observeModal = () => {
  const modalCallback: MutationCallback = mutations => {
    for (const mutation of mutations) {
      if (mutation.addedNodes.length) {
        const article = select('.tweet', mutation.addedNodes[0] as ParentNode)
        makeHarvester(article)
      }
    }
  }

  const options: MutationObserverInit = {
    childList: true,
  }

  observeElement('Modal', '#open-modal', modalCallback, options)
}

const observeColumns = () => {
  const observerOptions: MutationObserverInit = {
    childList: true,
  }

  const cb: MutationCallback = mutations => {
    for (const mutation of mutations) {
      for (const addedNode of mutation.addedNodes as unknown as HTMLCollection) {
        if (addedNode.classList.contains('column')) {
          initColumnObserver(addedNode as HTMLElement)
        }
      }
    }
  }

  observeElement('Column Container', '.app-columns', cb, observerOptions)
}

const observeDetail = (tweetDetail: HTMLElement) => {
  const detailOptions: MutationObserverInit = {
    childList: true,
    subtree: true,
  }

  const detailCallback: MutationCallback = mutations => {
    let after_replies: HTMLElement = null
    let before_replies: HTMLElement = null

    processRootTweets()

    for (const mutation of mutations) {
      if (!before_replies) {
        before_replies = select('.js-replies-before', mutation.target as unknown as ParentNode)
      }
      if (!after_replies) {
        after_replies = select('.replies-after', mutation.target as unknown as ParentNode)
      }
    }
    if (after_replies) observeDetailReplies(after_replies)
    if (before_replies) observeDetailReplies(before_replies)
  }

  observeElement('Tweet Detail', tweetDetail, detailCallback, detailOptions)
}

const observeStreamContainer = (streamContainer: HTMLElement) => {
  const options: MutationObserverInit = {
    childList: true,
  }

  const streamCallback: MutationCallback = mutations => {
    for (const mutation of mutations) {
      for (const addedNode of mutation.addedNodes) {
        if (deckStreamHasMedia(addedNode as ParentNode)) {
          makeHarvester(addedNode as HTMLElement)
        }
      }
    }
  }

  observeElement('Stream Container', streamContainer, streamCallback, options)
}

const initColumnObserver = (column: HTMLElement) => {
  const tweetContainer = select('.chirp-container', column)
  const tweetDetail = select('.column-detail', column)
  observeDetail(tweetDetail)
  observeStreamContainer(tweetContainer)
}

class TweetDeckLegacyObserver implements HarvestObserver {
  readonly observers: MutationObserver[] = []

  observeRoot() {
    const options: MutationObserverInit = {
      childList: true,
      subtree: true,
    }

    const cb: MutationCallback = (_, observer) => {
      processRootTweets()
      if (select.exists('#container')) {
        observeColumns()
        observeModal()
        // observer.disconnect()
      }
    }

    observeElement('Application', '.application', cb, options)
  }

  initialize() {
    processRootTweets()
  }
}

export default TweetDeckLegacyObserver
