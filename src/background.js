// TODO: loop for dealing json
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        downloadImage(JSON.parse(request.dataJSON))
    }
);

function downloadImage(images) {
    for (const image of images) {
        chrome.downloads.download({
            url: image.url,
            filename: image.name
        })
    }
}