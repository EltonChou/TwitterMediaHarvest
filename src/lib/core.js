import select from 'select-dom'
/**
 * MutationObserver
 * @param {String} element DOMSelector
 * @callback 
 * @param {JSON} options MutationsObserver options
 */
export const observeElement = (element, callback, options = {childList: true})=>{
    if (select(element)){
        const observer = new MutationObserver( callback )
        observer.observe( select(element), options )
        return observer
    } else return false
}

/**
 * Send download request message to background
 * @param {String} dataJSON
 */
export const downloadImage = (dataJSON)=>{
    chrome.runtime.sendMessage({
        dataJSON: dataJSON
    });
}