import MediaTweet from './lib/MediaTweet'
import TwitterMediaFile from './lib/TwitterMediaFile'
import { fetchCookie, removeFromLocalStorage } from './lib/chromeApi'
import {
  initStorage,
  fetchFileNameSetting,
  downloadItemRecorder,
} from './helpers/storageHelper'
import { notifyDownloadFailed } from './helpers/notificationHelper'
import { isDownloadInterrupted, isDownloadCompleted } from './utils/checker'
import { LOCAL_STORAGE_KEY_ARIA2, ARIA2_ID } from './constants'

chrome.runtime.onMessage.addListener(processRequest)
chrome.runtime.onInstalled.addListener(async details => {
  const reason = details.reason
  const prevVersion = details.previousVersion
  const currentVersion = chrome.runtime.getManifest().version

  if (reason === 'install') await initStorage()
  if (reason === 'update') showUpdateMessage(currentVersion, prevVersion)

  openOptionsPage()
})

chrome.downloads.onChanged.addListener(async downloadDelta => {
  if (downloadDelta.hasOwnProperty('state')) {
    const { id, endTime, state } = downloadDelta
    if (isDownloadInterrupted(state)) {
      notifyDownloadFailed(id, endTime.current)
    }
    if (isDownloadCompleted(state)) {
      notifyDownloadFailed(id, endTime.current)
      removeFromLocalStorage(id)
    }
  }
})

chrome.notifications.onButtonClicked.addListener()

chrome.browserAction.onClicked.addListener(openOptionsPage)

/**
 * Trigger browser-download
 * @typedef {import('./lib/TwitterMediaFile').tweetInfo} tweetInfo
 * @param {tweetInfo} tweetInfo twitter information
 * @returns {void}
 */
async function processRequest(tweetInfo) {
  const { value } = await fetchCookie({
    url: 'https://twitter.com',
    name: 'ct0',
  })
  const twitterMedia = new MediaTweet(tweetInfo.tweetId, value)
  const downloadMedia = mediasDownloader(tweetInfo)
  const infoRecorder = downloadItemRecorder(tweetInfo)

  twitterMedia
    .fetchMediaList()
    .then(mediaList => downloadMedia(mediaList, infoRecorder))
}

/**
 * @param {tweetInfo} tweetInfo
 * @returns {(mediaList: Array<string>, infoRecorder:) => Promise<void>}
 */
function mediasDownloader(tweetInfo) {
  return async (mediaList, infoRecorder) => {
    const setting = await fetchFileNameSetting()
    const isPassToAria2 = JSON.parse(
      localStorage.getItem(LOCAL_STORAGE_KEY_ARIA2)
    )
    const mode = isPassToAria2 ? 'aria2' : 'browser'

    for (const [index, value] of mediaList.entries()) {
      const mediaFile = new TwitterMediaFile(tweetInfo, value, index)
      const config = mediaFile.makeDownloadConfigBySetting(setting, mode)
      const downloadRecorder = infoRecorder(config)

      isPassToAria2
        ? chrome.runtime.sendMessage(ARIA2_ID, config)
        : chrome.downloads.download(config, downloadRecorder)
    }
  }
}

function openOptionsPage() {
  chrome.runtime.openOptionsPage()
}

/* eslint-disable no-console */
function showUpdateMessage(current, prev) {
  console.info('The extension has been updated.')
  console.info('Previous version:', prev)
  console.info('Current version:', current)
}
/* eslint-enable no-console */
