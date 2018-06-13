import {downloadImage} from './core'
import select from 'select-dom'

/**
 * element is addedNode
 * @param {HTMLElement} element 
 */
export const appendOrigClickTo = (element)=>{
    if (validateElementBeforeInsert(element)) {
        element.setAttribute('hasBeenAppended', true)
        select(".ProfileTweet-actionList.js-actions", element).appendChild(origClickFor(element))
    }
}


/**
 * only used in Gallery
 * @param {HTMLElement} element 
 */
export const insertOrigClickBeforeMore = (element)=>{
    if (validateElementBeforeInsert(element)) {
        const el = select(".ProfileTweet-actionList.js-actions", element)
        el.insertBefore(origClickFor(element), el.childNodes[9])
    }
}

/**
 * Should accept JSON
 * @param {HTMLElement} element 
 */
function origClickFor(element){
    const dataJSON = JSON.stringify(createDataJSON(element))
    const div = document.createElement('div')
    const button = document.createElement('button')
    const iconContainer = document.createElement('div')
    const span = document.createElement('span')
    iconContainer.setAttribute("id", "lazyOrigDownload")
    iconContainer.setAttribute('class', "IconContainer")
    span.setAttribute('class', "Icon")
    span.innerText = "Kappa"
    div.classList.add('lazyDownContainer')
    button.classList.add('ProfileTweet-actionButton')
    button.setAttribute('data-json', dataJSON)
    iconContainer.appendChild(span)
    button.appendChild(iconContainer)
    div.appendChild(button)
    button.addEventListener("click", function(){
        console.log(this.getAttribute('data-json'))
        downloadImage(this.getAttribute('data-json'))
    })
    return div
}

/**
 * https://pbs.twimg.com/media/DfOnhOzV4AAyvLE.png
 * @param {HTMLElement} element
 * @returns {String} json of images(in String)
 */
function createDataJSON(element){
    const photoContainers = select.all(".AdaptiveMedia-photoContainer", element)
    const preJSON = []
    for (const photoContainer of photoContainers){
        preJSON.push(createOrigUrlObject(photoContainer.getAttribute('data-image-url')))
    }
    return preJSON
}

/**
 * 
 * @param {String} url 
 * @returns {Object} JSON
 */
function createOrigUrlObject(url){
    const imageUrl = url.split(':')
    const dataUrl = imageUrl[0] + ":" + imageUrl[1] + ":orig"
    const dataName = imageUrl[1].split("/")[4]
    return { "url": dataUrl, "name": dataName }
}

/**
 * 
 * @param {HTMLElement} element 
 * @returns {String} url of image
 */
function getImageUrl(element){
    if (select.exists(".AdaptiveMedia-photoContainer.js-adaptive-photo", element)){
        console.log("Wut")
        // return select(".AdaptiveMedia-photoContainer.js-adaptive-photo", element).getAttribute("data-image-url")
    } else console.log("fUF")
    // else return select(".media-image", element).getAttribute("src")
}

function validateElementBeforeInsert(element){
    return element && !element.getAttribute('hasBeenAppended')
}