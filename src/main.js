require ('./assets/css/style.sass')

// Set button to first group of stream-item
const streamItems = document.getElementsByClassName("js-stream-item stream-item stream-item")
for ( let streamItem of streamItems) {
    if(Boolean(streamItem.getElementsByClassName("AdaptiveMedia-singlePhoto").length)){
        try {
            createLazyDown(streamItem)
        } catch(err){
            console.log(streamItem)
        }
    }
}

// FIXME: Detect url and set observer
const stream = document.querySelectorAll("#stream-items-id")[0]
let insertedNodes = []

// TODO: Permalink mutation-observe
// TODO: Gallery mutation-observe
let observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        insertedNodes.length = 0

        // FIXME: Should only use one loop.
        for (var i = 0; i < mutation.addedNodes.length; i++){
            insertedNodes.push(mutation.addedNodes[i])
        }
    })
    for (var i = 0; i < insertedNodes.length; i++){

        if(Boolean(insertedNodes[i].getElementsByClassName("AdaptiveMedia-singlePhoto").length)){
            try {
                createLazyDown(insertedNodes[i])
            } catch(err){
                console.log(insertedNodes[i])
                console.log(err)
            }
        }
    }
})

// observer.disconk,tnect()
try {
    observer.observe(stream, { childList: true })
} catch (err) {
    console.log(err)
}


// create embeded element
function createLazyDown(element) {
    const div = document.createElement('div')
    const button = document.createElement('div')
    const a = document.createElement('a')
    const imageUrl = element.getElementsByClassName("AdaptiveMedia-photoContainer js-adaptive-photo")[0].getAttribute("data-image-url").split(":")
    const dataUrl = imageUrl[0] + ":" + imageUrl[1] + ":orig"
    const dataName = imageUrl[1].split("/")[4]
    a.innerText = "Kappa"
    a.setAttribute("id", "lazyOrigDownload")
    div.classList.add('lazyDownContainer')
    button.classList.add('ProfileTweet-actionButton')
    button.setAttribute("data-url", dataUrl)
    button.setAttribute("data-name", dataName)
    button.appendChild(a)
    div.appendChild(button)
    element.getElementsByClassName("ProfileTweet-actionList js-actions")[0].appendChild(div)
    button.addEventListener("click", function(){
        downloadImage(this.getAttribute("data-url"), this.getAttribute("data-name"))
    })
}

function downloadImage(url, filename) {
    //Construct & send message
    chrome.runtime.sendMessage({
        url: url,
        filename: filename
    });
}