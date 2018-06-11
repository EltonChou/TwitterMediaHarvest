import './assets/css/style.sass'
import select from 'select-dom'
import domready from 'dom-loaded'

// TODO: When saving image from right-click menu, change the target link to *:orig
// TODO: onDetermineFilename change filename
// TODO: Export observer setting (??)

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

/**
 * MutationObserver
 * @param {String} element DOMSelector
 * @callback 
 * @param {Object} options MutationsObserver options
 */
function observeElement( element, callback, options = {childList: true} ) {
    if (element){
        const observer = new MutationObserver( callback )
        observer.observe( select(element), options )
        return observer
    } else return false
}

/**
 * Create appended button
 * @param {Object} DOMElement element
 */
function appendOrigClickTo(element) {
    if (validateElementBeforeInsert(element)) {
        element.setAttribute('hasBeenAppended', true)
        select(".ProfileTweet-actionList.js-actions", element).appendChild(origClickFor(element))
    }
}

function insertOrigClickBeforeMore(element, bool) {
    if (validateElementBeforeInsert(element)) {
        const el = select(".ProfileTweet-actionList.js-actions", element)
        el.insertBefore(origClickFor(element), el.childNodes[9])
    }
}

function getImageUrl (element) {
    return select.exists(".AdaptiveMedia-photoContainer.js-adaptive-photo", element)
    ? select(".AdaptiveMedia-photoContainer.js-adaptive-photo", element).getAttribute("data-image-url")
    : select(".media-image", element).getAttribute("src")
}

/**
 * 
 * @param {*} element 
 */
function origClickFor(element) {
    const imageUrl = getImageUrl(element).split(':')
    const div = document.createElement('div')
    const button = document.createElement('button')
    const iconContainer = document.createElement('div')
    const span = document.createElement('span')
    const dataUrl = imageUrl[0] + ":" + imageUrl[1] + ":orig"
    const dataName = imageUrl[1].split("/")[4]
    iconContainer.setAttribute("id", "lazyOrigDownload")
    iconContainer.setAttribute('class', "IconContainer")
    span.setAttribute('class', "Icon")
    span.innerText = "Kappa"
    div.classList.add('lazyDownContainer')
    button.classList.add('ProfileTweet-actionButton')
    button.setAttribute("data-url", dataUrl)
    button.setAttribute("data-name", dataName)
    iconContainer.appendChild(span)
    button.appendChild(iconContainer)
    div.appendChild(button)
    button.addEventListener("click", function(){
        downloadImage(this.getAttribute("data-url"), this.getAttribute("data-name"))
    })
    return div
}

function piorneer() {
    const streamItems = select.all('.js-stream-item')
    const permalink = select('.PermalinkOverlay-body')
    for (const streamItem of streamItems) {
        if(select.exists(".AdaptiveMedia-singlePhoto", streamItem)) {
            appendOrigClickTo(streamItem)
        }
    }
    if(select.exists(".AdaptiveMedia-singlePhoto", permalink)) {
        appendOrigClickTo(permalink)
    }
}

function validateElementBeforeInsert(element) {
    return element && !element.getAttribute('hasBeenAppended')
}

/**
 * Send download request message to background
 * @param {string} url url of image(orig)
 * @param {string} filename filename of image
 */
function downloadImage(url, filename) {
    chrome.runtime.sendMessage({
        url: url,
        filename: filename
    });
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