import select from 'select-dom'
import observeElement from './observer'
import makeHarvester from '../core'

const deckStreamHasMedia = (addedNode: Node) => {
  const hasMedia =
    select.exists('.media-preview', addedNode as unknown as ParentNode) ||
    select.exists('[rel="mediaPreview"]', addedNode as unknown as ParentNode) ||
    select.exists('.media-preview-container', addedNode as unknown as ParentNode)

  const notQuoted = !select.exists('.quoted-tweet', addedNode as unknown as ParentNode)

  const notYoutube = !select.exists('[rel="mediaPreview"][href*="youtube.com"]', addedNode as unknown as ParentNode)

  return hasMedia && notQuoted && notYoutube
}

const processRootTweets = () => {
  const rootTweets = select.all('.js-detail-content article')
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
        if (deckStreamHasMedia(addedNode)) {
          makeHarvester(addedNode as unknown as HTMLElement)
        }
      }
    }
  }

  observeElement(replies, repliesCallback, options)
}

const observeModal = () => {
  const modalCallback: MutationCallback = mutations => {
    for (const mutation of mutations) {
      if (mutation.addedNodes.length) {
        const article = select('.tweet', mutation.addedNodes[0] as unknown as ParentNode)
        makeHarvester(article)
      }
    }
  }

  const options: MutationObserverInit = {
    childList: true,
  }

  observeElement('#open-modal', modalCallback, options)
}

const observeColumns = () => {
  const columnContainer = select('.app-columns')

  const observerOptions: MutationObserverInit = {
    childList: true,
  }

  observeElement(
    columnContainer,
    mutations => {
      for (const mutation of mutations) {
        for (const addedNode of mutation.addedNodes as unknown as HTMLCollection) {
          if (addedNode.classList.contains('column')) {
            initColumnObserver(addedNode as HTMLElement)
          }
        }
      }
    },
    observerOptions
  )
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

  observeElement(tweetDetail, detailCallback, detailOptions)
}

const observeStreamContainer = (streamContainer: HTMLElement) => {
  const options: MutationObserverInit = {
    childList: true,
  }

  const streamCallback: MutationCallback = mutations => {
    for (const mutation of mutations) {
      for (const addedNode of mutation.addedNodes) {
        if (deckStreamHasMedia(addedNode)) {
          makeHarvester(addedNode as HTMLElement)
        }
      }
    }
  }

  observeElement(streamContainer, streamCallback, options)
}

const initColumnObserver = (column: HTMLElement) => {
  const tweetContainer = select('.chirp-container', column)
  const tweetDetail = select('.column-detail', column)
  observeDetail(tweetDetail)
  observeStreamContainer(tweetContainer)
}

class TweetDeckObserver implements HarvestObserver {
  observeRoot() {
    const options: MutationObserverInit = {
      childList: true,
    }

    observeElement(
      '.application',
      (_, this_observer) => {
        if (select.exists('.app-columns')) {
          this.initialize()
          observeColumns()
          observeModal()
          this_observer.disconnect()
        }
      },
      options
    )
  }

  initialize() {
    const columns = select.all('section.column')

    for (const column of columns) {
      initColumnObserver(column)
    }
  }
}

export default TweetDeckObserver
