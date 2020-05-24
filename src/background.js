import MediaTweet from './lib/MediaTweet'
import TwitterMediaFile from './lib/TwitterMediaFile'
import { fetchCookie } from './lib/chromeApi'
import {
  migrateStorage,
  initStorage,
  fetchFileNameSetting,
} from './utils/storageHelper'
import { makeChromeDownloadConfig } from './utils/maker'

/* eslint-disable no-console */
// eslint-disable-next-line no-undef
chrome.runtime.onInstalled.addListener(async details => {
  const reason = details.reason
  const prevVersion = details.previousVersion
  // eslint-disable-next-line no-undef
  const currentVersion = chrome.runtime.getManifest().version
  if (reason === 'update' && prevVersion !== currentVersion) {
    console.info('Previous version:', prevVersion)
    console.info('Current version:', currentVersion)
    await migrateStorage()
    console.info('The extension has been updated.')
  }
  if (reason === 'install') {
    await initStorage()
  }
  openOptionsPage()
})
/* eslint-enable no-console */

// eslint-disable-next-line no-undef
chrome.runtime.onMessage.addListener(async request => {
  await downloadMedias(request)
})

// eslint-disable-next-line no-undef
chrome.browserAction.onClicked.addListener(openOptionsPage)

/**
 * Trigger browser-download
 *
 * @function downloadVideo
 * @param {JSON} info twitter information
 */
async function downloadMedias(info) {
  // eslint-disable-next-line no-undef
  let { value } = await fetchCookie({ url: 'https://twitter.com', name: 'ct0' })

  const twitterMedia = new MediaTweet(info.tweetId, value)
  const mediaList = await twitterMedia.fetchMediaList()
  const setting = await fetchFileNameSetting()
  for (const [index, value] of mediaList.entries()) {
    const mediaFile = new TwitterMediaFile(info, value, index)
    const fileName = mediaFile.makeFileNameBySetting(setting)
    const fileSrc = mediaFile.getSrc()
    const downloadConfig = makeChromeDownloadConfig(fileSrc, fileName)
    // eslint-disable-next-line no-undef
    chrome.downloads.download(downloadConfig)
  }
}

function openOptionsPage() {
  // eslint-disable-next-line no-undef
  chrome.runtime.openOptionsPage()
}
