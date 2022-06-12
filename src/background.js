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
  isEnableAria2,
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
import { ACTION, ARIA2_ID, DOWNLOAD_MODE } from './constants'

/**
 * @typedef {Object} tweetInfo
 * @property {string} screenName
 * @property {string} tweetId
 */

const installReason = Object.freeze({
  install: 'install',
  update: 'update',
})

const processDownloadAction = async message => {
  /** @type tweetInfo */
  const tweetInfo = message.data

  /* eslint-disable no-console */
  if (isInvalidInfo(tweetInfo)) {
    console.Error('Invalid tweetInfo.')
    await Statistics.addErrorCount()
    throw Error(`Invalid tweet info. ${tweetInfo}`)
  }
  /* eslint-enable no-console */

  const ct0Value = await fetchTwitterCt0Cookie()
  const twitterMedia = new MediaTweet(tweetInfo.tweetId, ct0Value)
  let { mediaList, errorReason } = await twitterMedia.fetchMediaList()

  if (errorReason) {
    fetchErrorHandler(tweetInfo, errorReason)
    throw Error(`Fetching mediaList failed. ${errorReason.status}`)
  }

  const mediaDownloader = await MediaDownloader.build(tweetInfo)

  await mediaDownloader.downloadMedias(mediaList)
}

chrome.runtime.onMessage.addListener((message, sender, sendRespone) => {
  if (message.action !== ACTION.download) {
    return false
  }

  processDownloadAction(message)
    .then(() => sendRespone({ status: 'success' }))
    .catch(e => {
      sendRespone({ status: 'error' })
      throw e
    })

  return true // keep message channel open
})

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
    const { id, endTime, state, error } = downloadDelta
    if (isDownloadInterrupted(state)) {
      const { info } = await fetchDownloadItemRecord(id)
      let eventTime
      if (!error) {
        eventTime = 'current' in endTime ? endTime.current : Date.now()
      }
      if (error) {
        eventTime = Date.now()
      }
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

class MediaDownloader {
  constructor(tweetInfo, fileNameSettings) {
    this.tweetInfo = tweetInfo
    this.fileNameSettings = fileNameSettings
    this.isPassToAria2 = isEnableAria2()
    this.mode = this.isPassToAria2 ? DOWNLOAD_MODE.aria2 : DOWNLOAD_MODE.browser
    this.recorder = downloadItemRecorder(tweetInfo)
  }

  /**
   * @param {tweetInfo} tweetInfo
   */
  static async build(tweetInfo) {
    const fileNameSettings = await fetchFileNameSetting()
    return new MediaDownloader(tweetInfo, fileNameSettings)
  }

  async downloadMedias(mediaList) {
    for (const [index, value] of mediaList.entries()) {
      const mediaFile = new TwitterMediaFile(this.tweetInfo, value, index)
      const config = mediaFile.makeDownloadConfigBySetting(
        this.fileNameSettings,
        this.mode
      )

      const downloadCallback = this.recorder(config)
      this.isPassToAria2
        ? chrome.runtime.sendMessage(ARIA2_ID, config)
        : chrome.downloads.download(config, downloadCallback)
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
      return item.byExtensionId === runtimeId
    }
    return false
  })

  return Boolean(result.length)
}

async function openFailedTweetInNewTab(notifficationId) {
  // notificationId is tweet's id
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
