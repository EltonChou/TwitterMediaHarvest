// eslint-disable-next-line no-undef
chrome.runtime.onMessage.addListener(async request => {
  await downloadVideo(request)
})

/**
 * Trigger video browser-download
 *
 * @function downloadVideo
 * @param {JSON} info twitter information
 */
async function downloadVideo(info) {
  // eslint-disable-next-line no-undef
  let { value } = await fetchCookie({ url: 'https://twitter.com', name: 'ct0' })

  let twitterMedia = new TwitterMedia(info, value)
  let medias = await twitterMedia.getMedias()
  for (let media of medias) {
    // eslint-disable-next-line no-undef
    chrome.downloads.download(media)
  }
}

class TwitterMedia {
  constructor({ screenName, tweetId }, token) {
    this.screenName = screenName
    this.tweetId = tweetId
    this.header = initHeader(token)
    this.tweetAPIurl = `https://api.twitter.com/2/timeline/conversation/${tweetId}.json?tweet_mode=extended`
    this.activateUrl = 'https://api.twitter.com/1.1/guest/activate.json'
  }

  async getMedias() {
    let mediaRes = await fetch(this.tweetAPIurl, {
      method: 'GET',
      headers: this.header,
      mode: 'cors',
      cache: 'no-cache',
    })

    let detail = await mediaRes.json()
    return this.parseMedias(detail)
  }

  parseMedias(detail) {
    let medias =
      detail.globalObjects.tweets[this.tweetId].extended_entities.media

    let [{ video_info }] = medias
    return video_info ? this.parseVideo(video_info) : this.parseImage(medias)
  }

  async parseVideo(video_info) {
    let mediaList = []
    let { variants } = video_info

    let hiRes = 0
    let targetUrl

    for (let variant of variants) {
      let { bitrate, url } = variant
      // bitrate will be 0 if video is made from gif.
      // variants contains m3u8 info.
      let isHigher = bitrate > hiRes || bitrate === 0
      if (typeof bitrate !== 'undefined' && isHigher) {
        hiRes = bitrate
        targetUrl = url
      }
    }

    const conf = await this.makeChromeDownloadConf(targetUrl)
    mediaList.push(conf)
    return mediaList
  }

  async parseImage(medias) {
    let mediaList = []
    for (let media of medias) {
      let url = media.media_url_https
      const conf = await this.makeChromeDownloadConf(url, true)
      mediaList.push(conf)
    }
    return mediaList
  }

  async makeChromeDownloadConf(mediaUrl, isImage = false) {
    let downloadsDirectory =
      (await fetchStorage(['directory'])).directory || 'twitter_media_harvest'

    const regex = new RegExp('(?:[^/])+(?<=(?:.jpg|mp4|png|gif))')
    mediaUrl = new URL(mediaUrl)
    if (isImage) mediaUrl.searchParams.append('name', 'orig')
    const name = mediaUrl.pathname.match(regex)

    return {
      url: mediaUrl.href,
      filename: `${downloadsDirectory}/${this.screenName}_${this.tweetId}_${name}`,
      conflictAction: 'overwrite',
    }
  }
}

function initHeader(token) {
  let header = new Headers()
  header.append(
    'Authorization',
    'Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA'
  )
  header.append(
    'User-Agent',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.38 (KHTML, like Gecko) Version/11.0 Mobile/15A372 Safari/604.1'
  )
  header.append('cache-control', 'no-cache')
  header.append('x-twitter-active-user', 'yes')
  header.append('x-twitter-auth-type', 'OAuth2Session')
  header.append('x-csrf-token', token)
  return header
}

function fetchStorage(keys) {
  return new Promise(resolve => {
    // eslint-disable-next-line no-undef
    chrome.storage.sync.get(keys, result => resolve(result))
  })
}

function fetchCookie(target) {
  return new Promise(resolve => {
    // eslint-disable-next-line no-undef
    chrome.cookies.get(target, cookie => resolve(cookie))
  })
}
