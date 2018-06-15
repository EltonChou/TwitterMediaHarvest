import './assets/css/style.sass'
import select from 'select-dom'
import domready from 'dom-loaded'
import { observeElement, observeVideo } from './lib/core'
import { appendOrigClickTo, insertOrigClickBeforeMore } from './lib/utils'

// TODO: When saving image from right-click menu, change the target link to *:orig
// TODO: onDetermineFilename change filename

// FIXME: need to observe video-container
function piorneer() {
    const streamItems = select.all('.js-stream-item')
    const permalink = select('.PermalinkOverlay-body')

    for (const streamItem of streamItems) {
        if (select.exists('.PlayableMedia-player', streamItem)) {
            observeVideo('.PlayableMedia-player', streamItem, mutations => {
                for (const mutation of mutations) {
                    observeVideo('div[role=button]', mutation.target, mutations => {
                        for (const mutation of mutations) {
                            console.log(select('video', mutation.addedNodes[0]).getAttribute('src'))
                        }
                    }, { childList: true })
                }
            }, { childList: true })
        }
        if (select.exists(".AdaptiveMedia-photoContainer", streamItem)) {
            appendOrigClickTo(streamItem)
        }
    }
    if (select.exists(".AdaptiveMedia-photoContainer", permalink)) {
        appendOrigClickTo(permalink)
    }
}

function observeTitle() {
    const body = select('body')
    observeElement('title', mutations => {
        if (!body.classList.contains("overlay-enabled")) {
            refresh()
        } else return false
    }, { childList: true, subtree: true })
}

function observePermalink() {
    observeElement('.PermalinkOverlay-body', mutations => {
        for (const mutation of mutations) {
            if (mutation.addedNodes.length) {
                const inners = select.all('.permalink-inner', mutation.target.parentElement)
                for (const inner of inners) {
                    try {
                        appendOrigClickTo(inner)
                    } catch (err) {
                        console.log(err)
                    }
                }
            }
        }
    }, { childList: true })
}

function observeGallery() {
    observeElement('.GalleryTweet', mutations => {
        for (const mutation of mutations) {
            // console.log(mutation)
            if (mutation.addedNodes.length) {
                insertOrigClickBeforeMore(mutation.target)
            }
        }
    }, { childList: true })
}

function observeStream() {
    observeElement('#stream-items-id', mutations => {
        for (const mutation of mutations) {
            for (const addedNode of mutation.addedNodes) {
                if (select.exists(".AdaptiveMedia-Container", addedNode)) {
                    appendOrigClickTo(addedNode)
                }
            }
        }
    }, { childList: true })
}

function init() {
    piorneer()
    observeTitle()
    observeStream()
    observeGallery()
    observePermalink()
}

function refresh() {
    domready.then(() => {
        piorneer()
        observeStream()
    })
}

init()