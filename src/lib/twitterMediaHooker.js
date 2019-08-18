import url from 'url'
import path from 'path'

const initHeader = () => {
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
  return header
}

export class TwitterMedia {
  constructor(screenName, tweetId) {
    this.screenName = screenName
    this.tweetId = tweetId
    this.header = initHeader()
    this.tweetAPIurl = `https://api.twitter.com/2/timeline/conversation/${tweetId}.json?tweet_mode=extended`
    this.activateUrl = 'https://api.twitter.com/1.1/guest/activate.json'
    this.getGuestToken()
    this.detail = this.getTweetDetail()
    this.medias = []
  }

  async getGuestToken() {
    // eslint-disable-next-line no-undef
    chrome.cookies.get({ url: 'https://twitter.com', name: 'ct0' }, cookie =>
      this.header.append('x-csrf-token', cookie.value)
    )
    let actRes = await fetch(this.activateUrl, {
      method: 'POST',
      mode: 'cors',
      credentials: 'same-origin',
      headers: this.header,
    })

    let data = await actRes.json()
    this.header.append('x-guest-token', data['guest_token'])
  }

  async getTweetDetail() {
    let mediaRes = await fetch(this.tweetAPIurl, {
      method: 'GET',
      credentials: 'same-origin',
      headers: this.header,
    })

    return mediaRes
  }

  pasrseMedia() {
    this.detail.globalObjects.tweets[this.tweetId].extended_entities.media['0']
      .video_info
      ? this.parseVideo()
      : this.parseImage()
  }

  parseVideo() {
    let variants = this.detail.globalObjects.tweets[this.tweetId]
      .extended_entities.media['0'].video_info.variants

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
    this.medias.append(conf)
  }

  parseImage() {
    let medias = this.detail.globalObjects.tweets[this.tweetId].entities.media

    for (let media of medias) {
      const conf = this.makeChromeDownloadConf(media['media_url_https'])
      this.medias.append(conf)
    }
  }

  makeChromeDownloadConf(mediaUrl) {
    const parsed = url.parse(mediaUrl)
    const filename = path.basename(parsed.pathname)
    return {
      url: url,
      filename: `${this.tweetId}-${filename}`,
      conflictAction: 'overwrite',
    }
  }
}
