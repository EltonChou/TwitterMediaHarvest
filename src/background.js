import TwitterMedia from './lib/TwitterMedia'
import { fetchCookie } from './lib/chromeApi'

// eslint-disable-next-line no-undef
chrome.runtime.onMessage.addListener(async request => {
  await downloadMedias(request)
})

/**
 * Trigger browser-download
 *
 * @function downloadVideo
 * @param {JSON} info twitter information
 */
async function downloadMedias(info) {
  // eslint-disable-next-line no-undef
  let { value } = await fetchCookie({ url: 'https://twitter.com', name: 'ct0' })

  let twitterMedia = new TwitterMedia(info, value)
  let medias = await twitterMedia.getMedias()
  for (let media of medias) {
    // eslint-disable-next-line no-undef
    chrome.downloads.download(media)
  }
}
