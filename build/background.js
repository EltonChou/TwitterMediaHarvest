// TODO: loop for dealing json
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        downloadImage(request.url, request.filename)
    }
);

function downloadImage(url, filename) {
    chrome.downloads.download({
        url: url,
        filename: filename
    })
}