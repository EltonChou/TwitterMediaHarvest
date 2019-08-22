// eslint-disable-next-line no-undef
chrome.runtime.onMessage.addListener(async request => {
  await downloadVideo(JSON.parse(request.info))
})

/**
 * Trigger video browser-download
 *
 * @function downloadVideo
 * @param {JSON} info twitter information
 */
async function downloadVideo(info) {
  // eslint-disable-next-line no-undef
  chrome.cookies.get(
    { url: 'https://twitter.com', name: 'ct0' },
    async cookie => {
      let twitterMedia = new TwitterMedia(info, cookie.value)
      let detail = await twitterMedia.getTweetDetail()
      twitterMedia.parseMedia(detail)
      for (let media of twitterMedia.medias) {
        // eslint-disable-next-line no-undef
        chrome.downloads.download(media)
      }
    }
  )
}

const initHeader = token => {
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

class TwitterMedia {
  constructor(info, token) {
    this.screenName = info.screenName
    this.tweetId = info.tweetId
    this.header = initHeader(token)
    this.tweetAPIurl = `https://api.twitter.com/2/timeline/conversation/${info.tweetId}.json?tweet_mode=extended`
    this.activateUrl = 'https://api.twitter.com/1.1/guest/activate.json'
    this.medias = []
  }

  async getTweetDetail() {
    let mediaRes = await fetch(this.tweetAPIurl, {
      method: 'GET',
      mode: 'cors',
      credentials: 'include',
      headers: this.header,
    })

    let detail = await mediaRes.json()
    return detail
  }

  parseMedia(detail) {
    this.detail = detail
    let medias =
      detail.globalObjects.tweets[this.tweetId].extended_entities.media
    medias[0].video_info ? this.parseVideo(medias) : this.parseImage(medias)
  }

  parseVideo(medias) {
    let variants = medias['0'].video_info.variants

    let hiRes = 0
    let targetId = 0
    for (let i in variants) {
      if (variants[i].bitrate) {
        if (variants[i].bitrate > hiRes) {
          hiRes = variants[i].bitrate
          targetId = i
        }
      }
    }

    const videoUrl = variants[targetId].url
    const conf = this.makeChromeDownloadConf(videoUrl)
    this.medias.push(conf)
  }

  parseImage(medias) {
    for (let media of medias) {
      const conf = this.makeChromeDownloadConf(media['media_url_https'])
      this.medias.push(conf)
    }
  }

  makeChromeDownloadConf(mediaUrl) {
    const regex = new RegExp('(?:[^/])+(?<=(?:.jpg|mp4|png|gif))')
    mediaUrl = new URL(mediaUrl)
    mediaUrl.searchParams.append('name', 'orig')
    const name = mediaUrl.pathname.match(regex)
    return {
      url: mediaUrl.href,
      filename: `${this.screenName}_${this.tweetId}_${name}`,
      conflictAction: 'overwrite',
    }
  }
}
