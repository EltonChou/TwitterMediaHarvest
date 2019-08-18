import { TwitterMedia } from './lib/twitterMediaHooker'

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
function downloadVideo(info) {
  const twitterMedia = TwitterMedia[info.tweetId]
  twitterMedia.parseMedia()
  for (let media of twitterMedia.medias) {
    // eslint-disable-next-line no-undef
    chrome.downloads.download(media)
  }
}
