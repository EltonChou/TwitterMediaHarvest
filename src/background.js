import MediaTweet from './libs/MediaTweet'
import TwitterMediaFile from './libs/TwitterMediaFile'
import Statistics from './libs/Statistics'
import {
  searchDownload,
  removeFromLocalStorage,
  getExtensionId,
} from './libs/chromeApi'
import {
  initStorage,
  fetchFileNameSetting,
  downloadItemRecorder,
  fetchDownloadItemRecord,
  fetchTwitterCt0Cookie,
} from './helpers/storageHelper'
import {
  notifyDownloadFailed,
  notifyMediaListFetchError,
  notifyUnknownFetchError,
} from './helpers/notificationHelper'
import {
  isDownloadInterrupted,
  isDownloadCompleted,
  isInvalidInfo,
} from './utils/checker'
import {
  ACTION,
  ARIA2_ID,
  LOCAL_STORAGE_KEY_ARIA2,
  DOWNLOAD_MODE,
} from './constants'

const installReason = Object.freeze({
  install: 'install',
  update: 'update',
})

chrome.runtime.onMessage.addListener(processRequest)
chrome.runtime.onInstalled.addListener(async details => {
  const reason = details.reason
  const previousVersion = details.previousVersion

  if (reason === installReason.install) await initStorage()
  if (reason === installReason.update) {
    showUpdateMessageInConsole(previousVersion)
  }

  openOptionsPage()
})

chrome.downloads.onChanged.addListener(async downloadDelta => {
  const isDownloadedBySelf = await checkItemIsDownloadedBySelf(downloadDelta.id)
  if (!isDownloadedBySelf) return false

  const isStateChanged = 'state' in downloadDelta

  if (isStateChanged && isDownloadedBySelf) {
    const { id, endTime, state } = downloadDelta
    if (isDownloadInterrupted(state)) {
      const { info } = await fetchDownloadItemRecord(id)
      const eventTime = 'current' in endTime ? endTime.current : Date.now()
      await Statistics.addFailedDownloadCount()
      notifyDownloadFailed(info, id, eventTime)
    }

    if (isDownloadCompleted(state)) {
      removeFromLocalStorage(id)
      await Statistics.addSuccessDownloadCount()
    }

    refreshOptionsPage()
  }
})

chrome.downloads.onDeterminingFilename.addListener((downloadItem, suggest) => {
  const { byExtensionId } = downloadItem
  if (byExtensionId) {
    if (byExtensionId === getExtensionId()) {
      fetchDownloadItemRecord(downloadItem.id).then(record => {
        const { config } = record
        suggest(config)
      })
      return true
    }
  }
})

chrome.notifications.onClosed.addListener(removeFromLocalStorage)
chrome.notifications.onClicked.addListener(async notifficationId => {
  openFailedTweetInNewTab(notifficationId)
  removeFromLocalStorage(notifficationId)
})

chrome.notifications.onButtonClicked.addListener(
  async (notifficationId, buttonIndex) => {
    if (buttonIndex === 0) {
      openFailedTweetInNewTab(notifficationId)
    }

    if (buttonIndex === 1) {
      retryDownload(notifficationId)
    }

    removeFromLocalStorage(notifficationId)
  }
)

chrome.browserAction.onClicked.addListener(openOptionsPage)

// FIXME: what a mess recorder
/**
 * Trigger browser-download
 * @typedef {import('./libs/TwitterMediaFile').tweetInfo} tweetInfo
 * @returns {void}
 */
async function processRequest(request) {
  if (request.action !== ACTION.download) return false
  /** @type tweetInfo */
  const tweetInfo = request.data

  /* eslint-disable no-console */
  if (isInvalidInfo(tweetInfo)) {
    console.Error('Invalid tweetInfo.')
    await Statistics.addErrorCount()
    return false
  }
  /* eslint-enable no-console */

  const ct0Value = await fetchTwitterCt0Cookie()
  const twitterMedia = new MediaTweet(tweetInfo.tweetId, ct0Value)
  const downloadMedia = mediasDownloader(tweetInfo)
  const downloadInfoRecorder = downloadItemRecorder(tweetInfo)

  let { mediaList, errorReason } = await twitterMedia.fetchMediaList()

  if (errorReason) {
    fetchErrorHandler(tweetInfo, errorReason)
    return false
  }

  downloadMedia(mediaList, downloadInfoRecorder)
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
    const mode = isPassToAria2 ? DOWNLOAD_MODE.aria2 : DOWNLOAD_MODE.browser

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

function refreshOptionsPage() {
  chrome.runtime.sendMessage({ action: ACTION.refresh })
}

/* eslint-disable no-console */
function showUpdateMessageInConsole(previous) {
  const current = chrome.runtime.getManifest().version
  console.info('The extension has been updated.')
  console.info('Previous version:', previous)
  console.info('Current version:', current)
}
/* eslint-enable no-console */

async function checkItemIsDownloadedBySelf(downloadId) {
  const runtimeId = getExtensionId()
  const query = {
    id: downloadId,
  }
  const result = await searchDownload(query)
  result.filter(item => {
    if ('byExtensionId' in item) {
      return item['byExtensionId'] === runtimeId
    }
    return false
  })

  return Boolean(result.length)
}

async function openFailedTweetInNewTab(notifficationId) {
  //FIXME: notifficationID checker
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

async function fetchErrorHandler(tweetInfo, reason) {
  let notify
  switch (reason.status) {
    case 429:
      notify = notifyMediaListFetchError
      break

    default:
      notify = notifyUnknownFetchError
      break
  }

  await Statistics.addErrorCount()
  notify(tweetInfo, reason)
}

async function retryDownload(dawnloadItemId) {
  const { info, config } = await fetchDownloadItemRecord(dawnloadItemId)
  const downloadRecorder = downloadItemRecorder(info)(config)
  chrome.downloads.download(config, downloadRecorder)
}
