require ('./assets/css/style.sass')

// Set button to first group of stream-item

doFirst()

const body = document.querySelector('body')
const stream = document.querySelectorAll("#stream-items-id")[0]
const galleryTweet = document.querySelector('.GalleryTweet')
let insertedNodes = []

// TODO: When saving image from right-click menu, change the target link to *:orig
// TODO: onDetermineFilename change filename
// TODO: When route change need to start observer again
// TODO: Export observer setting
// TODO: Permalink mutation-observe
observeElement( galleryTweet, mutations => {
    for (const mutation of mutations) {
        if (mutation.addedNodes.length){
            appendOrigClickTo(mutation.target.parentElement)
        }
    }
}, {childList: true})

// FIXME: Should only use one loop.
observeElement( stream, mutations => {
    // console.log(mutations)
    for (const mutation of mutations){
        insertedNodes = mutation.addedNodes
    }

    for (const insertedNode of insertedNodes) {
        if (insertedNode.getElementsByClassName("AdaptiveMedia-singlePhoto").length) {
            try {
                appendOrigClickTo(insertedNode)
            } catch(err) {
                console.log(insertedNode)
                console.log(err)
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
    const imageUrl = 
    element.getElementsByClassName("AdaptiveMedia-photoContainer js-adaptive-photo")[0] ?
    element.getElementsByClassName("AdaptiveMedia-photoContainer js-adaptive-photo")[0].getAttribute("data-image-url")
    : element.getElementsByClassName("media-image")[0].getAttribute("src")

    const el = element.getElementsByClassName("ProfileTweet-actionList js-actions")[0]
    el.appendChild(origClick(imageUrl))
}

function origClick(url) {
    const imageUrl = url.split(':')
    const div = document.createElement('div')
    const button = document.createElement('div')
    const a = document.createElement('a')
    const dataUrl = imageUrl[0] + ":" + imageUrl[1] + ":orig"
    const dataName = imageUrl[1].split("/")[4]
    a.innerText = "Kappa"
    a.setAttribute("id", "lazyOrigDownload")
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
function doFirst(){
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