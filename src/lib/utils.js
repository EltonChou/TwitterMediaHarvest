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
 * 
 * @param {HTMLElement} element 
 * @returns {Boolean} Is element has been appended?
 */
function validateElementBeforeInsert(element) {
    return element && !element.getAttribute('hasBeenAppended')
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
    const preJSON = []
    if (select.exists(".AdaptiveMedia-videoContainer", element)) {
        const media = select(("video"), element)
        if (media){
            preJSON.push(createVideoUrlObject(media.getAttribute('src')))
        } else preJSON.push(false)
    } else {
        const media = select.all(".AdaptiveMedia-photoContainer", element)
        for (const image of media) {
            preJSON.push(createImageUrlObject(image.getAttribute('data-image-url')))
        }
    }
    return preJSON
}

/**
 * When media is 
 * @param {String} url 
 * @returns {JSON} JSON
 */
function createImageUrlObject(url) {
    const imageUrl = url.split(':')
    const dataUrl = imageUrl[0] + ":" + imageUrl[1] + ":orig"
    const dataName = imageUrl[1].split("/")[4]
    return { "url": dataUrl, "name": dataName }
}

/**
 * When media is  https://video.twimg.com/tweet_video/DflXwcXVMAERICE.mp4
 * @param {String} url 
 * @returns {JSON} JSON
 */
function createVideoUrlObject(url) {
    const videoUrl = url.split(':')
    let dataUrl = videoUrl[0] + ":" + videoUrl[1]
    let dataName = videoUrl[1].split("/")[5]
    if (videoUrl[0] === 'blob'){
        dataUrl = url
        dataName = url.split('/')[3]
    }
    return { "url": dataUrl, "name": dataName }
}