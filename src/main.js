require ('./assets/css/style.sass')
const galleryTweet = document.querySelector('.GalleryTweet')
const permalink = document.querySelector('.PermalinkOverlay-body')
/*
 * Append button to status of first-group
 */

// TODO: When saving image from right-click menu, change the target link to *:orig
// TODO: onDetermineFilename change filename
// TODO: Export observer setting (??)

function observeTitle() {
    const title = document.querySelector('title')
    const body = document.querySelector('body')
    // const title = document.querySelector('#sr-event-log')
    observeElement( title, mutations => {
        for ( const mutation of mutations ) {
            console.log(mutation)
        }
        if( body.classList.contains("overlay-enabled")) {
            return false
        } else {
            reload()
        }
    }, { childList: true, subtree: true })
}

function observePermalink() {
    observeElement( permalink, mutations => {
        for (const mutation of mutations) {
            console.log(mutation)
            if (mutation.addedNodes.length) {
                for( const inner of mutation.target.parentElement.querySelectorAll('.permalink-inner') ) {
                    appendOrigClickTo(inner)
                }
            }
        }
    }, {childList: true})
}

function observeGallery() {    
    observeElement( galleryTweet, mutations => {
        for (const mutation of mutations) {
            if (mutation.addedNodes.length) {
                insertOrigClickBeforeMore(mutation.target.parentElement)
            }
        }
    }, {childList: true})   
}

function observeStream() {
    const stream = document.querySelectorAll("#stream-items-id")[0]   
    observeElement( stream, mutations => {
        for (const mutation of mutations) {
            for (const addedNode of mutation.addedNodes) {
                if (addedNode.querySelector(".AdaptiveMedia-singlePhoto")) {
                    appendOrigClickTo(addedNode)
                }
            }
        }
    }, {childList: true})    
}

/**
 * MutationObserver
 * @param {Object} element DOMElement
 * @callback 
 * @param {Object} options MutationsObserver options
 */
function observeElement( element, callback, options = {childList: true} ) {
    if (!element){
        return false
    }
    const observer = new MutationObserver( callback )
    try {
        observer.observe( element, options )
    } catch (err) {
        console.log(err)
        console.log(element)
    } 
    return observer
}

/**
 * Create appended button
 * @param {Object} DOMElement element
 */
function appendOrigClickTo(element) {
    if (!element || element.getAttribute('hasBeenAppended')) {
        return false
    } else {
        try {
            element.setAttribute('hasBeenAppended', true)
            element.getElementsByClassName("ProfileTweet-actionList js-actions")[0].appendChild(origClickFor(element))
        } catch(err){
            console.error(err)
        }
    }
}

function validateElement(element) {
    return element && !element.getAttribute('hasBeenAppended')
}

function insertOrigClickBeforeMore(element) {
    if (!element) {
        return false
    }
    if (element.getAttribute('hasBeenAppended')){
        return false
    } else {
        element.setAttribute('hasBeenAppended', true)
    const el = element.getElementsByClassName("ProfileTweet-actionList js-actions")[0]
    el.insertBefore(origClickFor(element), el.childNodes[9])
    }
}

function getImageUrl (element) {
    return element.getElementsByClassName("AdaptiveMedia-photoContainer js-adaptive-photo")[0] 
        ? element.getElementsByClassName("AdaptiveMedia-photoContainer js-adaptive-photo")[0].getAttribute("data-image-url")
        : element.getElementsByClassName("media-image")[0].getAttribute("src")
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
    const streamItems = document.getElementsByClassName("js-stream-item stream-item stream-item")
    for ( const streamItem of streamItems) {
        if( streamItem.getElementsByClassName("AdaptiveMedia-singlePhoto").length && !streamItem.getAttribute('hasBeenAppended') ){
            appendOrigClickTo(streamItem)
        }
    }
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