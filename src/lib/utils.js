import { downloadImage } from './core'
import select from 'select-dom'

/**
 * element is addedNode
 * @param {HTMLElement} element 
 */
export const appendOrigClickTo = element => {
    if (validateElementBeforeInsert(element)) {
        element.setAttribute('hasBeenAppended', true)
        select(".ProfileTweet-actionList.js-actions", element).appendChild(origClickFor(element))
    }
}


/**
 * only used in Gallery
 * @param {HTMLElement} element 
 */
export const insertOrigClickBeforeMore = element => {
    if (validateElementBeforeInsert(element)) {
        const el = select(".ProfileTweet-actionList.js-actions", element)
        el.insertBefore(origClickFor(element), el.childNodes[9])
    }
}

/**
 * Should accept JSON
 * @param {HTMLElement} element
 * @returns {HTMLDivElement}
 */
function origClickFor(element) {
    const dataJSON = JSON.stringify(createDataJSON(element))
    const div = document.createElement('div')
    const button = document.createElement('button')
    const iconContainer = document.createElement('div')
    const span = document.createElement('span')
    const bubble = document.createElement('span')
    iconContainer.setAttribute("id", "lazyOrigDownload")
    iconContainer.setAttribute('class', "IconContainer")
    span.setAttribute('class', "Icon Icon--medium lazy-download")
    span.setAttribute('id', "lazyIcon")
    bubble.setAttribute('class', 'u-hiddenVisually')
    bubble.innerText = "OrigClick"
    div.setAttribute('class', 'lazyDownContainer js-tooltip')
    div.setAttribute('data-original-title', 'OrigClick')
    button.setAttribute('class', 'ProfileTweet-actionButton u-textUserColorHover js-actionButton')
    button.setAttribute('data-json', dataJSON)
    iconContainer.appendChild(span)
    iconContainer.appendChild(bubble)
    button.appendChild(iconContainer)
    div.appendChild(button)
    button.addEventListener("click", function () {
        downloadImage(this.getAttribute('data-json'))
    })
    return div
}

/**
 * https://pbs.twimg.com/media/DfOnhOzV4AAyvLE.png
 * @param {HTMLElement} element
 * @returns {String} json of images(in String)
 */
function createDataJSON(element) {
    const photoContainers = select.all(".AdaptiveMedia-photoContainer", element)
    const preJSON = []
    for (const photoContainer of photoContainers) {
        preJSON.push(createOrigUrlObject(photoContainer.getAttribute('data-image-url')))
    }
    return preJSON
}

/**
 * 
 * @param {String} url 
 * @returns {JSON} JSON
 */
function createOrigUrlObject(url) {
    const imageUrl = url.split(':')
    const dataUrl = imageUrl[0] + ":" + imageUrl[1] + ":orig"
    const dataName = imageUrl[1].split("/")[4]
    return { "url": dataUrl, "name": dataName }
}

/**
 * 
 * @param {HTMLElement} element 
 * @returns {Boolean} Is element has been appended?
 */
function validateElementBeforeInsert(element) {
    return element && !element.getAttribute('hasBeenAppended')
}