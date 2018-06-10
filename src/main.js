import './assets/css/style.sass'
import select from 'select-dom'

/*
 * Append button to status of first-group
 */

// TODO: When saving image from right-click menu, change the target link to *:orig
// TODO: onDetermineFilename change filename
// TODO: Export observer setting (??)

//TODO: Permalink
function piorneer() {
    const streamItems = select("js-stream-item stream-item stream-item")
    for ( const streamItem of streamItems) {
        if( select("AdaptiveMedia-singlePhoto", streamItem).length && !streamItem.getAttribute('hasBeenAppended') ){
            appendOrigClickTo(streamItem)
        }
    }
}

function observeTitle() {
    observeElement( "title", mutations => {
        if( select('body').classList.contains("overlay-enabled")) {
            return false
        } else {
            reload()
        }
    }, { childList: true, subtree: true })
}

function observePermalink() {    
    observeElement( ".PermalinkOverlay-body", mutations => {
        for (const mutation of mutations) {
            if (mutation.addedNodes.length) {
                for( const inner of select.all(".permalink-inner", mutation.target.parentElement)) {
                    appendOrigClickTo(inner)
                }
            }
        }
    }, {childList: true})
}

function observeGallery() {
    observeElement( ".GalleryTweet", mutations => {
        for (const mutation of mutations) {
            if (mutation.addedNodes.length) {
                insertOrigClickBeforeMore(mutation.target.parentElement)
            }
        }
    }, {childList: true})   
}

function observeStream() {
    observeElement( "#stream-items-id", mutations => {
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
 * @param {String} selector DOMElement
 * @callback 
 * @param {Object} options MutationsObserver options
 */
function observeElement( selector, callback, options = {childList: true} ) {
    if (!select.exists(selector)){
        return false
    }
    const observer = new MutationObserver( callback )
    try {
        observer.observe( select(selector), options )
    } catch (err) {
        console.log(err)
    } 
    return observer
}

/**
 * Create appended button
 * @param {Object} DOMElement element
 */
function appendOrigClickTo(element) {
    if (validateElementBeforeInsert(element)) {
        return false
    } else {
        try {
            element.setAttribute('hasBeenAppended', true)
            select("ProfileTweet-actionList js-actions", element).appendChild(origClickFor(element))
        } catch(err){
            console.error(err)
        }
    }
}

function insertOrigClickBeforeMore(element) {
    if (validateElementBeforeInsert(element)) {
        return false
    } else {
        element.setAttribute('hasBeenAppended', true)
        select("ProfileTweet-actionList js-actions", element).insertBefore(origClickFor(element), el.childNodes[9])
    }
}

function getImageUrl (element) {
    return select("AdaptiveMedia-photoContainer js-adaptive-photo", element)
        ? select("AdaptiveMedia-photoContainer js-adaptive-photo", element).getAttribute("data-image-url")
        : select("media-image", element).getAttribute("src")
}

function validateElementBeforeInsert(element) {
    return element && !element.getAttribute('hasBeenAppended')
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

/**
 * Send download request message to background
 * @param {string} url url of image(orig)
 * @param {string} filename filename of image
 */
function downloadImage(url, filename) {
    //Construct & send message
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

function reload() {
    piorneer()
    observeStream()
}

init()