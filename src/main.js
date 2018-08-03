import './assets/css/style.sass'
import select from 'select-dom'
import domready from 'dom-loaded'
import { observeElement, observeVideo } from './lib/core'
import { appendOrigClickTo, insertOrigClickBeforeMore } from './lib/utils'

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
    const streamItems = select.all('.js-stream-item')
    const permalink = select('.permalink-tweet-container')

    for (const streamItem of streamItems) {
        if (select.exists('.PlayableMedia-player', streamItem)) {
            obVideo(streamItem)
        }
        if (select.exists(".AdaptiveMedia-photoContainer", streamItem)) {
            appendOrigClickTo(streamItem)
        }
    }

    if (select.exists('.PlayableMedia-player', permalink)) {
        obVideo(permalink)
    }
    if (select.exists(".AdaptiveMedia-photoContainer", permalink)) {
        appendOrigClickTo(permalink)
    }
}

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