import './assets/css/style.sass'
import select from 'select-dom'
import { observeElement } from './lib/core'
import { makeOrigClick } from './lib/utils'

const titleOptions = {
  childList: true,
  subtree: true,
}

const hasMedia = ele => {
  return (
    select.exists('.PlayableMedia-player', ele) ||
    select.exists('.AdaptiveMedia-photoContainer', ele)
  )
}

const piorneer = () => {
  const streamItems = select.all('.js-stream-item')
  const permalink = select('.permalink-tweet-container')
  // Observe tweet stream
  for (const streamItem of streamItems) {
    if (hasMedia(streamItem)) makeOrigClick(streamItem)
  }
  // if is permalink page append origclick
  if (hasMedia(permalink)) makeOrigClick(permalink)
}

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

function observeThread() {
  observeElement('#descendants #stream-items-id', mutations => {
    for (const mutation of mutations) {
      for (const addedNode of mutation.addedNodes) {
        if (hasMedia(addedNode)) makeOrigClick(addedNode)
      }
    }
  })
}

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

function observeGallery() {
  observeElement('.GalleryTweet', mutations => {
    for (const mutation of mutations) {
      if (mutation.addedNodes.length) {
        makeOrigClick(mutation.target, 'insert')
      }
    }
  })
}

function observeStream() {
  observeElement('#stream-items-id', mutations => {
    for (const mutation of mutations) {
      for (const addedNode of mutation.addedNodes) {
        if (hasMedia(addedNode)) makeOrigClick(addedNode)
      }
    }
  })
}

const init = () => {
  piorneer()
  observeTitle()
  observeStream()
  observeThread()
  observeGallery()
  observePermalink()
}

init()
