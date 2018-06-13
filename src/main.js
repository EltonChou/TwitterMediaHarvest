import './assets/css/style.sass'
import select from 'select-dom'
import domready from 'dom-loaded'
import {observeElement} from './lib/core'
import {appendOrigClickTo, insertOrigClickBeforeMore, origClickFor, getDataJSON, getImageUrl, validateElementBeforeInsert} from './lib/temp'


// TODO: When saving image from right-click menu, change the target link to *:orig
// TODO: onDetermineFilename change filename
// TODO: Export observer setting (??)
/**
 * TODO:data-url, data-name => JSON
 * [{'data-url':'https://pbs.twimg.com/medias/THENAME1.EXT:orig','data-name':'THENAME1.EXT'},
 * {'data-url':'https://pbs.twimg.com/medias/THENAME2.EXT:orig','data-name':'THENAME2.EXT'}]
 */

function piorneer() {
    const streamItems = select.all('.js-stream-item')
    const permalink = select('.PermalinkOverlay-body')
    for (const streamItem of streamItems) {
        if (select.exists(".AdaptiveMedia-singlePhoto", streamItem)) {
            appendOrigClickTo(streamItem)
        }
        const photoContainers = select.all(".AdaptiveMedia-photoContainer.js-adaptive-photo", streamItem)
        for (const photoContainer of photoContainers) {
            
        }
    }
    if (select.exists(".AdaptiveMedia-singlePhoto", permalink)) {
        appendOrigClickTo(permalink)
    }
}

function observeTitle() {
    const body = select('body')
    observeElement( 'title', mutations => {
        if( !body.classList.contains("overlay-enabled")) {
            refresh()
        } else return false
    }, { childList: true, subtree: true })
}

function observePermalink() {
    observeElement( '.PermalinkOverlay-body', mutations => {
        for (const mutation of mutations) {
            if (mutation.addedNodes.length) {
                const inners = select.all('.permalink-inner', mutation.target.parentElement)
                for( const inner of inners ) {
                    try {
                        appendOrigClickTo(inner)
                    } catch(err) {
                        console.log('fuck')
                    }
                }
            }
        }
    }, {childList: true})
}

function observeGallery() {    
    observeElement( '.GalleryTweet', mutations => {
        for (const mutation of mutations) {
            console.log(mutation)
            if (mutation.addedNodes.length) {
                insertOrigClickBeforeMore(mutation.target)
            }
        }
    }, {childList: true})   
}

function observeStream() {
    observeElement( '#stream-items-id', mutations => {
        for (const mutation of mutations) {
            for (const addedNode of mutation.addedNodes) {
                if (select.exists(".AdaptiveMedia-singlePhoto", addedNode)) {
                    appendOrigClickTo(addedNode)
                }
            }
        }
    }, {childList: true})
}

function init() {
    piorneer()
    observeTitle()
    observeStream()
    observeGallery()
    observePermalink()
}

function refresh() {
    domready.then(()=>{
        piorneer()
        observeStream()
    })
}

init()