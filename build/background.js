// TODO: loop for dealing json
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        downloadImage(request.dataJSON)
    }
);

function downloadImage(dataJSON) {
    for (const image of dataJSON) {
        chrome.downloads.download({
            url: image.url,
            filename: image.name
        })
    }
}