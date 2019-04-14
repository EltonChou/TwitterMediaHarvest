import './assets/css/style.sass'
import select from 'select-dom'
import { observeElement } from './lib/core'
import { makeOrigClick } from './lib/utils'

<<<<<<< HEAD
// TODO: When saving image from right-click menu, change the target link to *:orig
// TODO: onDetermineFilename change filename

function obVideo(videoContain) {
    observeVideo({
        element: '.PlayableMedia-player',
        parent: videoContain,
        callback: mutations => {
            for (const mutation of mutations) {
                observeVideo({
                    element: 'div[role=button]',
                    parent: mutation.target,
                    callback: mutations => {
                        for (const mutation of mutations) {
                            appendOrigClickTo(videoContain)
                        }
                    }
                })
            }
        }
    })
}

function piorneer() {
    const streamItems = select.all('.tweet')
    const permalink = select('.permalink-tweet-container')
=======
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
>>>>>>> dev

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

<<<<<<< HEAD
function observePermalink() {
    observeElement({
        element: '.PermalinkOverlay-body',
        callback: mutations => {
            for (const mutation of mutations) {
                if (mutation.addedNodes.length) {
                    const container = select('.permalink-tweet-container', mutation.target.parentElement)
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
        }
    })
}

function observeTitle() {
    const body = select('body')
    observeElement({
        element: 'title',
        callback: mutations => {
            if (!body.classList.contains("overlay-enabled")) {
                main.refresh()
            } else return false
        },
        options: { childList: true, subtree: true }
    })
}

function observeGallery() {
    observeElement({
        element: '.GalleryTweet',
        callback: mutations => {
            for (const mutation of mutations) {
                if (mutation.addedNodes.length) {
                    insertOrigClickBeforeMore(mutation.target)
                }
            }
        }
    })
}

function observeStream() {
    observeElement({
        element: '#stream-items-id',
        callback: mutations => {
            for (const mutation of mutations) {
                for (const addedNode of mutation.addedNodes) {
                    if (select.exists('.PlayableMedia-player', addedNode)) {
                        obVideo(addedNode)
                    } else {
                        (select.exists(".AdaptiveMedia-Container", addedNode))
                        appendOrigClickTo(addedNode)
                    }

                }
            }
        }
    })
}

const main = {
    init: () => {
        piorneer()
        observeTitle()
        observeStream()
        observeGallery()
        observePermalink()
    },
    refresh: () => {
        domready.then(() => {
            piorneer()
            observeStream()
        })
    }
}

main.init()
=======
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
>>>>>>> dev
