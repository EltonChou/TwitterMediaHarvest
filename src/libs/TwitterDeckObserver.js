import select from 'select-dom'
import makeHarvester from '../core'
import observeElement from '../utils/observer'

/**
 *
 * @param {Node} addedNode
 * @returns boolean
 */
const deckStreamHasMedia = addedNode =>
  select.exists('.media-preview', addedNode) &&
  !select.exists('.quoted-tweet', addedNode)

const observerDetailReplies = replies => {
  /** @type {MutationObserverInit} */
  const options = {
    childList: true,
  }

  /** @type {MutationCallback} */
  const repliesCallback = mutations => {
    for (const mutation of mutations) {
      for (const addedNode of mutation.addedNodes) {
        if (deckStreamHasMedia(addedNode)) {
          makeHarvester(addedNode)
        }
      }
    }
  }

  observeElement(replies, repliesCallback, options)
}

const observeModal = () => {
  /** @type {MutationCallback} */
  const modalCallback = mutations => {
    for (const mutation of mutations) {
      if (mutation.addedNodes) {
        const article = select('.tweet', mutation.addedNodes[0])
        makeHarvester(article)
      }
    }
  }

  /** @type {MutationObserverInit} */
  const options = {
    childList: true,
  }

  observeElement('#open-modal', modalCallback, options)
}

const observeColumns = () => {
  const columnContainer = select('.app-columns')

  /** @type {MutationObserverInit} */
  const observerOptions = {
    childList: true,
  }

  observeElement(
    columnContainer,
    mutations => {
      for (const mutation of mutations) {
        for (const addedNode of mutation.addedNodes) {
          console.log(addedNode)
        }
      }
    },
    observerOptions
  )
}

export default class TwitterDeckObserver {
  /** @returns {void} */
  observeRoot() {
    /** @type {MutationObserverInit} */
    const options = {
      childList: true,
    }

    observeElement(
      '.application',
      (_, this_observer) => {
        if (select.exists('.app-columns')) {
          this.initObservers()
          observeColumns()
          this_observer.disconnect()
        }
      },
      options
    )
  }

  /** @returns {void} */
  initObservers() {
    const tweetContainers = select.all('.chirp-container')
    const tweetDetails = select.all('.column-detail')

    for (const tweetDetail of tweetDetails) {
      this.observeDetail(tweetDetail)
    }

    for (const tweetContainer of tweetContainers) {
      this.observeStreamContainer(tweetContainer)
    }

    observeModal()
  }

  observeStreamContainer(streamContainer) {
    /** @type {MutationObserverInit} */
    const options = {
      childList: true,
    }

    /** @type {MutationCallback} */
    const streamCallback = mutations => {
      for (const mutation of mutations) {
        for (const addedNode of mutation.addedNodes) {
          if (deckStreamHasMedia(addedNode)) {
            makeHarvester(addedNode)
          }
        }
      }
    }

    observeElement(streamContainer, streamCallback, options)
  }

  observeDetail(tweetDetail) {
    /** @type {MutationObserverInit} */
    const detailOptions = {
      childList: true,
      subtree: true,
    }

    /** @type {MutationCallback} */
    const detailCallback = mutations => {
      let replies = null
      const rootTweets = select.all('.js-detail-content article')

      for (const tweet of rootTweets) {
        if (deckStreamHasMedia(tweet)) makeHarvester(tweet)
      }

      for (const mutation of mutations) {
        if (!replies) {
          replies = select('.replies-after', mutation.target)
        }
      }
      observerDetailReplies(replies)
    }

    observeElement(tweetDetail, detailCallback, detailOptions)
  }
}
