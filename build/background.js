chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        console.log(request);
        console.log(sender);
        downloadImage(request.url, request.filename)
    }
);

function downloadImage(url, filename) {
    chrome.downloads.download({
        url: url,
        filename: filename
    })
}