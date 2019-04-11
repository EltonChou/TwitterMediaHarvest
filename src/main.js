import './assets/css/style.sass'
import select from 'select-dom'
import domready from 'dom-loaded'
import { observeElement, observeVideo } from './lib/core'
import { appendOrigClickTo, insertOrigClickBeforeMore } from './lib/utils'

// TODO: When saving image from right-click menu, change the target link to *:orig
// TODO: onDetermineFilename change filename


function obVideo(videoContain) {
  observeVideo(
    '.PlayableMedia-player',
    videoContain,
    mutations => {
      for (const mutation of mutations) {
        observeVideo(
          'div[role=button]',
          mutation.target,
          mutations => {
            for (const mutation of mutations) {
              appendOrigClickTo(videoContain)
            }
          },
          { childList: true }
        )
      }
    },
    { childList: true }
  )
}

function piorneer() {
  const streamItems = select.all('.js-stream-item')
  const permalink = select('.permalink-tweet-container')

  // Observe tweet stream
  for (const streamItem of streamItems) {
    if (select.exists('.PlayableMedia-player', streamItem)) {
      obVideo(streamItem)
    }
    if (select.exists('.AdaptiveMedia-photoContainer', streamItem)) {
      appendOrigClickTo(streamItem)
    }
  }

  // if is permalink page append origclick
  if (select.exists('.PlayableMedia-player', permalink)) {
    obVideo(permalink)
  }
  if (select.exists('.AdaptiveMedia-photoContainer', permalink)) {
    appendOrigClickTo(permalink)
  }
}

function observePermalink() {
  observeElement(
    '.PermalinkOverlay-body',
    mutations => {
      for (const mutation of mutations) {
        if (mutation.addedNodes.length) {
          const container = select(
            '.permalink-tweet-container',
            mutation.target.parentElement
          )
          if (select.exists('.PlayableMedia-player', container)) {
            obVideo(container)
          } else {
            try {
              appendOrigClickTo(container)
            } catch (err) {
              console.log(err)
            }
          }
        }
      }
    },
    { childList: true }
  )
}

function observeTitle() {
  const body = select('body')
  observeElement(
    'title',
    mutations => {
      if (!body.classList.contains('overlay-enabled')) {
        refresh()
      } else return false
    },
    { childList: true, subtree: true }
  )
}

function observeGallery() {
  observeElement(
    '.GalleryTweet',
    mutations => {
      for (const mutation of mutations) {
        if (mutation.addedNodes.length) {
          insertOrigClickBeforeMore(mutation.target)
        }
      }
    },
    { childList: true }
  )
}

function observeStream() {
  observeElement(
    '#stream-items-id',
    mutations => {
      for (const mutation of mutations) {
        for (const addedNode of mutation.addedNodes) {
          if (select.exists('.PlayableMedia-player', addedNode)) {
            obVideo(addedNode)
          } else {
            select.exists('.AdaptiveMedia-Container', addedNode)
            appendOrigClickTo(addedNode)
          }
        }
      }
    },
    { childList: true }
  )
}

const init = () => {
  piorneer()
  observeTitle()
  observeStream()
  observeGallery()
  observePermalink()
}

const refresh = () => {
  domready.then(() => {
    piorneer()
    observeStream()
  })
}

domready.then(()=>init())
