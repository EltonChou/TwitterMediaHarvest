import MediaTweet from './lib/MediaTweet'
import TwitterMediaFile from './lib/TwitterMediaFile'
import { fetchCookie, removeFromLocalStorage } from './lib/chromeApi'
import {
  initStorage,
  fetchFileNameSetting,
  fetchDownloadItemRecord,
  setDownloadItemRecord,
} from './utils/storageHelper'
import { makeDownloadErrorNotificationConfig } from './utils/notificationHelper'
import { isDownloadInterrupted, isDownloadCompleted } from './utils/checker'
import { LOCAL_STORAGE_KEY_ARIA2, ARIA2_ID } from './constants'

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
    if (isDownloadInterrupted(downloadDelta.state)) {
      const { info } = await fetchDownloadItemRecord(downloadDelta.id)
      const notiConf = makeDownloadErrorNotificationConfig(info.tweetId)
      chrome.notifications.create(info.tweetId, notiConf)
    }
    if (isDownloadCompleted(downloadDelta.state)) {
      await removeFromLocalStorage(downloadDelta.id)
    }
  }
})

chrome.runtime.onMessage.addListener(processRequest)
chrome.browserAction.onClicked.addListener(openOptionsPage)

/**
 * Trigger browser-download
 * @typedef {import('./lib/TwitterMediaFile').tweetInfo} tweetInfo
 * @param {tweetInfo} tweetInfo twitter information
 * @returns {void}
 */
async function processRequest(tweetInfo) {
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
  let configRecorder = setDownloadItemRecord(tweetInfo)

  for (const [index, value] of mediaList.entries()) {
    const mediaFile = new TwitterMediaFile(tweetInfo, value, index)
    const config = mediaFile.makeDownloadConfigBySetting(setting, downloadTool)
    configRecorder = configRecorder(config)

    isPassToAria2
      ? chrome.runtime.sendMessage(ARIA2_ID, config)
      : chrome.downloads.download(config, configRecorder)
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
