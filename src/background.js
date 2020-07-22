import MediaTweet from './lib/MediaTweet'
import TwitterMediaFile from './lib/TwitterMediaFile'
import {
  fetchCookie,
  searchDownload,
  removeFromLocalStorage,
} from './lib/chromeApi'
import {
  initStorage,
  fetchFileNameSetting,
  downloadItemRecorder,
  fetchDownloadItemRecord,
} from './helpers/storageHelper'
import {
  notifyFetchError,
  notifyDownloadFailed,
} from './helpers/notificationHelper'
import { isDownloadInterrupted, isDownloadCompleted } from './utils/checker'
import {
  ARIA2_ID,
  DEFAULT_DIRECTORY,
  LOCAL_STORAGE_KEY_ARIA2,
} from './constants'

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
  const isDownloadedBySelf = await checkDownloadItem(downloadDelta.id)
  if (!isDownloadedBySelf) return false

  const isStateChanged = downloadDelta.hasOwnProperty('state')

  if (isStateChanged) {
    const { id, endTime, state } = downloadDelta
    if (isDownloadInterrupted(state)) {
      const { info } = await fetchDownloadItemRecord(id)
      notifyDownloadFailed(info, id, endTime.current)
    }
    if (isDownloadCompleted(state)) {
      removeFromLocalStorage(id)
    }
  }
})

chrome.notifications.onClosed.addListener(removeFromLocalStorage)
chrome.notifications.onClicked.addListener(async notifficationId => {
  openTweetFailed(notifficationId)
  removeFromLocalStorage(notifficationId)
})

chrome.notifications.onButtonClicked.addListener(
  async (notifficationId, buttonIndex) => {
    if (buttonIndex === 0) {
      openTweetFailed(notifficationId)
    }
    if (buttonIndex === 1) {
      const { info, config } = await fetchDownloadItemRecord(notifficationId)
      const downloadRecorder = downloadItemRecorder(info)(config)
      chrome.downloads.download(config, downloadRecorder)
    }
    removeFromLocalStorage(notifficationId)
  }
)

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
    .catch(reason => notifyFetchError(tweetInfo, reason))
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

async function checkDownloadItem(downloadId) {
  const query = {
    id: downloadId,
    filenameRegex: DEFAULT_DIRECTORY,
  }
  const result = await searchDownload(query)
  return Boolean(result.length)
}

async function openTweetFailed(notifficationId) {
  const isDownloadId = notifficationId.length < 10
  let tweetId
  if (isDownloadId) {
    const { info } = await fetchDownloadItemRecord(notifficationId)
    tweetId = info.tweetId
  }
  if (!isDownloadId) {
    tweetId = notifficationId
  }

  const url = `https://twitter.com/i/web/status/${tweetId}`
  chrome.tabs.create({ url: url })
}
