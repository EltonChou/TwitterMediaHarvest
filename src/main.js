require ('./assets/css/style.sass')

const body = document.querySelector('body')
const stream = document.querySelectorAll("#stream-items-id")[0]
const galleryTweet = document.querySelector('.GalleryTweet')
const permalink = document.querySelector('.PermalinkOverlay-body')
const title = document.querySelector('title')

// TODO: When saving image from right-click menu, change the target link to *:orig
// TODO: onDetermineFilename change filename
// TODO: Export observer setting
// TODO: Permalink mutation-observe
// TODO: When route change need to start observer again
observeElement( title, mutations => {
    for ( const mutation of mutations ) {
    }
}, {childList: true})

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

observeElement( galleryTweet, mutations => {
    for (const mutation of mutations) {
        if (mutation.addedNodes.length) {
            insertOrigClickBeforeMore(mutation.target.parentElement)
        }
    }
}, {childList: true})

observeElement( stream, mutations => {
    for (const mutation of mutations) {
        for (const addedNode of mutation.addedNodes) {
            if (addedNode.querySelector(".AdaptiveMedia-singlePhoto")) {
                appendOrigClickTo(addedNode)
            }
        }
    }
}, {childList: true})


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
    element.getElementsByClassName("ProfileTweet-actionList js-actions")[0].appendChild(origClickFor(element))
}

function getImageUrl (element) {
    return element.getElementsByClassName("AdaptiveMedia-photoContainer js-adaptive-photo")[0] 
        ? element.getElementsByClassName("AdaptiveMedia-photoContainer js-adaptive-photo")[0].getAttribute("data-image-url")
        : element.getElementsByClassName("media-image")[0].getAttribute("src")
}

function insertOrigClickBeforeMore(element) {
    const el = element.getElementsByClassName("ProfileTweet-actionList js-actions")[0]
    el.insertBefore(origClickFor(element), el.childNodes[9])
}

function origClickFor(element) {
    const imageUrl = getImageUrl(element).split(':')
    const div = document.createElement('div')
    const button = document.createElement('div')
    const a = document.createElement('a')
    const dataUrl = imageUrl[0] + ":" + imageUrl[1] + ":orig"
    const dataName = imageUrl[1].split("/")[4]
    a.innerText = "Kappa"
    a.setAttribute("id", "lazyOrigDownload")
    a.setAttribute('class', "IconContainer")
    div.classList.add('lazyDownContainer')
    button.classList.add('ProfileTweet-actionButton')
    button.setAttribute("data-url", dataUrl)
    button.setAttribute("data-name", dataName)
    button.appendChild(a)
    button.addEventListener("click", function(){
        downloadImage(this.getAttribute("data-url"), this.getAttribute("data-name"))
    })
    div.appendChild(button)
    return div
}

/**
 * Append button to status of first-group
 */
function init(){
    const streamItems = document.getElementsByClassName("js-stream-item stream-item stream-item")
    for ( const streamItem of streamItems) {
        if( streamItem.getElementsByClassName("AdaptiveMedia-singlePhoto").length ){
            try {
                appendOrigClickTo(streamItem)
            } catch(err){
                console.log(streamItem)
            }
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

init()