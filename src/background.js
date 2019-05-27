/**
 * listen to message from content script.
 */
// eslint-disable-next-line no-undef
chrome.runtime.onMessage.addListener(async request => {
  !request.medias
    ? await downloadVideo(JSON.parse(request.info))
    : downloadImage(JSON.parse(request.info), JSON.parse(request.medias))
})

/**
 * trigger browser-download
 * @param {JSON} images images-data
 */
function downloadImage(info, medias) {
  for (const media of medias) {
    // eslint-disable-next-line no-undef
    chrome.downloads.download({
      url: media.url,
      filename: `${info.screenName}-${info.userId}-${info.tweetId}-${
        media.name
      }`,
      conflictAction: 'overwrite',
    })
  }
}

function downloadVideo(info) {
  let regex = new RegExp('\\w+\\.mp4')
  fetchMedia(info, url => {
    const name = url.match(regex)
    // eslint-disable-next-line no-undef
    chrome.downloads.download({
      url: url,
      filename: `${info.screenName}-${info.userId}-${info.tweetId}-${name}`,
      conflictAction: 'overwrite',
    })
  })
}

function fetchMedia(info, fn) {
  // eslint-disable-next-line no-undef
  const header = new Headers()
  const url = `https://api.twitter.com/2/timeline/conversation/${
    info.tweetId
  }.json?tweet_mode=extended`
  const activateUrl = 'https://api.twitter.com/1.1/guest/activate.json'

  header.append(
    'Authorization',
    'Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA'
  )
  header.append(
    'User-Agent',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.38 (KHTML, like Gecko) Version/11.0 Mobile/15A372 Safari/604.1'
  )
  header.append('cache-control', 'no-cache')

  // eslint-disable-next-line no-undef
  chrome.cookies.get(
    { url: 'https://twitter.com', name: 'ct0' },
    async cookie => {
      header.append('x-csrf-token', cookie.value)

      // eslint-disable-next-line no-undef
      let res = await fetch(activateUrl, {
        method: 'POST',
        mode: 'cors',
        credentials: 'same-origin',
        headers: header,
      })

      let data = await res.json()

      header.append('x-guest-token', data['guest_token'])

      // eslint-disable-next-line no-undef
      let mediaRes = await fetch(url, {
        method: 'GET',
        credentials: 'same-origin',
        headers: header,
      })

      let conversation = await mediaRes.json()
      // console.log(mediaUrl)
      let variants =
        conversation.globalObjects.tweets[info.tweetId].extended_entities.media[
          '0'
        ].video_info.variants

      let hd = 1
      let targetId = 0
      for (let i in variants) {
        if (variants[i].bitrate) {
          if (variants[i].bitrate > hd) {
            hd = variants[i].bitrate
            targetId = i
          }
        }
      }
      fn(variants[targetId].url)
    }
  )
}
