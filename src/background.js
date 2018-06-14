/**
 * listen to message from content script.
 */
chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        downloadImage(JSON.parse(request.dataJSON))
    }
);

/**
 * trigger browser-download
 * @param {JSON} images images-data
 */
function downloadImage(images) {
    for (const image of images) {
        chrome.downloads.download({
            url: image.url,
            filename: image.name
        })
    }
}