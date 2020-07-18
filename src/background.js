import MediaTweet from './lib/MediaTweet'
import TwitterMediaFile from './lib/TwitterMediaFile'
import { fetchCookie } from './lib/chromeApi'
import { initStorage, fetchFileNameSetting } from './utils/storageHelper'
import { LOCAL_STORAGE_KEY_ARIA2, ARIA2_ID } from './constants'

// eslint-disable-next-line no-undef
chrome.runtime.onInstalled.addListener(async details => {
  const reason = details.reason
  const prevVersion = details.previousVersion
  // eslint-disable-next-line no-undef
  const currentVersion = chrome.runtime.getManifest().version

  if (reason === 'install') await initStorage()
  if (reason === 'update') showUpdateMessage(currentVersion, prevVersion)

  openOptionsPage()
})

/* eslint-disable no-undef */
chrome.runtime.onMessage.addListener(processRequest)
chrome.browserAction.onClicked.addListener(openOptionsPage)
/* eslint-enable no-undef */

/**
 * Trigger browser-download
 * @typedef {import('./lib/TwitterMediaFile').tweetInfo} tweetInfo
 * @param {tweetInfo} tweetInfo twitter information
 * @returns {void}
 */
async function processRequest(tweetInfo) {
  // eslint-disable-next-line no-undef
  let { value } = await fetchCookie({ url: 'https://twitter.com', name: 'ct0' })
  const twitterMedia = new MediaTweet(tweetInfo.tweetId, value)

  twitterMedia
    .fetchMediaList()
    .then(mediaList => downloadMedias(mediaList, tweetInfo))
}

/**
 * @param {Array<String>} mediaList
 * @param {tweetInfo} tweetInfo
 * @returns {void}
 */
async function downloadMedias(mediaList, tweetInfo) {
  const setting = await fetchFileNameSetting()
  const isPassToAria2 = JSON.parse(
    localStorage.getItem(LOCAL_STORAGE_KEY_ARIA2)
  )
  const downloadTool = isPassToAria2 ? 'aria2' : 'browser'

  for (const [index, value] of mediaList.entries()) {
    const mediaFile = new TwitterMediaFile(tweetInfo, value, index)
    const config = mediaFile.makeDownloadConfigBySetting(setting, downloadTool)

    /* eslint-disable no-undef */
    isPassToAria2
      ? chrome.runtime.sendMessage(ARIA2_ID, config)
      : chrome.downloads.download(config)
    /* eslint-enable no-undef */
  }
}

function openOptionsPage() {
  // eslint-disable-next-line no-undef
  chrome.runtime.openOptionsPage()
}

/* eslint-disable no-console */
function showUpdateMessage(current, prev) {
  console.info('The extension has been updated.')
  console.info('Previous version:', prev)
  console.info('Current version:', current)
}
/* eslint-enable no-console */
