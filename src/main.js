import './assets/css/style.sass'
import select from 'select-dom'
import { observeElement } from './lib/core'
import { makeOrigClick } from './lib/utils'

/**
 * Options of MutationObserve
 *
 * @type {JSON}
 */
const titleOptions = {
  childList: true,
  subtree: true,
}

/**
 * Check media is exist in tweet or not.
 *
 * @param {HTMLelement} ele A valid tweet element.
 * @returns {Boolean} Media is exist in tweet or not.
 */
const hasMedia = ele => {
  return (
    select.exists('.PlayableMedia-player', ele) ||
    select.exists('.AdaptiveMedia-photoContainer', ele)
  )
}

/**
 * Initialize OrigClick
 *
 * @function piorneer
 */
const piorneer = () => {
  const streamItems = select.all('.js-stream-item')
  const permalink = select('.permalink-tweet-container')
  for (const streamItem of streamItems) {
    if (hasMedia(streamItem)) makeOrigClick(streamItem)
  }
  if (hasMedia(permalink)) makeOrigClick(permalink)
}

/**
 * Observe title of page to refresh initializer.
 *
 * @function observeTitle
 */
function observeTitle() {
  const body = select('body')
  observeElement(
    'title',
    () => {
      if (!body.classList.contains('overlay-enabled')) init()
    },
    titleOptions
  )
}

/**
 * Observe twitter stream.
 *
 * @function observeStream
 */
function observeStream() {
  observeElement('#stream-items-id', mutations => {
    for (const mutation of mutations) {
      for (const addedNode of mutation.addedNodes) {
        if (hasMedia(addedNode)) makeOrigClick(addedNode)
      }
    }
  })
}

/**
 * Observe Permalink
 *
 * @function observePermalink
 */
function observePermalink() {
  observeElement('.PermalinkOverlay-body', mutations => {
    for (const mutation of mutations) {
      if (mutation.addedNodes.length) {
        piorneer()
        observeThread()
      }
    }
  })
}

/**
 * Observe media gallery.
 *
 * @function observeGallery
 */
function observeGallery() {
  observeElement('.GalleryTweet', mutations => {
    for (const mutation of mutations) {
      if (mutation.addedNodes.length) {
        makeOrigClick(mutation.target, 'insert')
      }
    }
  })
}

/**
 * Observe thread below the tweet in Permalink or Gallerey
 *
 * @function observeThread
 */
function observeThread() {
  observeElement('#descendants #stream-items-id', mutations => {
    for (const mutation of mutations) {
      for (const addedNode of mutation.addedNodes) {
        if (hasMedia(addedNode)) makeOrigClick(addedNode)
      }
    }
  })
}

/**
 * Initialize the observer.
 *
 * @function init
 */
const init = () => {
  piorneer()
  observeTitle()
  observeStream()
  observeThread()
  observeGallery()
  observePermalink()
}

init()
