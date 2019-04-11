import select from 'select-dom'

/**
 * MutationObserver
 * @param {String} element DOMSelector
 * @callback 
 * @param {JSON} options MutationsObserver options
 */
const observeElement = (element, callback, options={ childList: true }) => {
    if (select.exists(element)) {
        const observer = new MutationObserver(callback)
        observer.observe(select(element), options)
        return observer
    }
}

const observeVideo = (element, parent, callback, options={ childList: true }) => {
    if (select.exists(element, parent)){
        const observer = new MutationObserver(callback)
        observer.observe(select(element, parent), options)
        return observer
    }
}

/**
 * Send download request message to background
 * @param {String} dataJSON
 */
const downloadImage = (dataJSON) => {
    chrome.runtime.sendMessage({
        dataJSON: dataJSON
    });
}

export {observeElement, observeVideo, downloadImage}