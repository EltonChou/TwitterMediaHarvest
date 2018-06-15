import select from 'select-dom'
/**
 * MutationObserver
 * @param {String} element DOMSelector
 * @callback 
 * @param {JSON} options MutationsObserver options
 */
export const observeElement = (element, callback, options = { childList: true }) => {
    if (select.exists(element)) {
        const observer = new MutationObserver(callback)
        observer.observe(select(element), options)
        return observer
    } else return false
}

export const observeVideo = (element, parent, callback, options = { childList: true }) => {
    const observer = new MutationObserver(callback)
    observer.observe(select(element, parent), options)
    return observer
}

/**
 * Send download request message to background
 * @param {String} dataJSON
 */
export const downloadImage = (dataJSON) => {
    chrome.runtime.sendMessage({
        dataJSON: dataJSON
    });
}