import './assets/css/style.sass'
import select from 'select-dom'
import { observeElement } from './lib/core'
import { makeOrigClick, hasMedia } from './lib/utils'

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
 * Initialize OrigClick
 *
 * @function piorneer
 */
const piorneer = () => {
  const articles = select.all('article')
  const modal = select('[aria-labelledby = modal-header]')
  for (const article of articles) {
    if (hasMedia(article)) makeOrigClick(article)
  }
  if (hasMedia(modal)) makeOrigClick(modal)
}

/**
 * When page changed refresh the initializer.
 *
 * @function observeTitle
 */
function observeTitle() {
  observeElement('title', () => init(), titleOptions)
}

/**
 * Observe twitter stream.
 *
 * @function observeStream
 */
function observeStream() {
  observeElement('section > div > div > div', mutations => {
    for (const mutation of mutations) {
      for (const addedNode of mutation.addedNodes) {
        if (hasMedia(addedNode)) makeOrigClick(addedNode)
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
  observeElement('#react-root > div > div', mutations => {
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
}

init()
