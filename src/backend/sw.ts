import * as Sentry from '@sentry/browser'
import { SENTRY_DSN } from '../constants'
import Statistics from './libs/Statistics'
import MediaDownloader from './libs/MediaDownloader'
import { fetchMediaList } from './libs/MediaTweet'
import {
  getExtensionId,
  openOptionsPage,
} from '../libs/chromeApi'
import {
  isDownloadedBySelf,
  isInvalidInfo,
} from './utils/checker'
import DownloadStateUtil from './utils/DownloadStateUtil'
import DownloadRecordUtil from './utils/DownloadRecordUtil'
import {
  downloadItemRecorder,
  fetchDownloadItemRecord,
  fetchTwitterCt0Cookie,
  initStorage,
  migrateStorage,
  removeDownloadItemRecord,
} from './helpers/storageHelper'
import {
  notifyDownloadFailed,
  notifyMediaListFetchError,
  notifyUnknownFetchError,
} from './helpers/notificationHelper'
import { Action } from '../typings'

Sentry.init({
  dsn: SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.3 : 0.8,
  environment: process.env.NODE_ENV
})

const enum InstallReason {
  Install = 'install',
  Update = 'update',
}

const enum InterruptReason {
  UserCancel = 'USER_CANCELED'
}

/* eslint-disable no-console */
const processDownloadAction = async (tweetInfo: TweetInfo) => {
  console.log('Processing download. Info:', tweetInfo)
  Sentry.addBreadcrumb({
    category: 'download',
    message: 'Process download.',
    level: 'info',
  })

  if (isInvalidInfo(tweetInfo)) {
    console.error('Invalid tweetInfo.')
    await Statistics.addErrorCount()
    throw new Error(`Invalid tweetInfo. ${tweetInfo}`)
  }

  const mediaDownloader = await MediaDownloader.build(tweetInfo)
  const ct0Value = await fetchTwitterCt0Cookie()
  try {
    console.log('Fetching media info...')
    const mediaList = await fetchMediaList(tweetInfo.tweetId, ct0Value)
    mediaDownloader.downloadMedias(mediaList)
  } catch (reason) {
    console.log('Error reason: ', reason)
    fetchErrorHandler(
      tweetInfo,
      'status' in reason ?
        reason :
        { status: 500, title: 'InternalError', message: 'message' in reason ? reason.message : 'Unknown Error.' }
    )
    throw new Error(reason.message)
  }
}
/* eslint-disable no-console */

chrome.runtime.onMessage.addListener((message: HarvestMessage, sender, sendRespone) => {
  if (message.action === Action.Download) {
    processDownloadAction(message.data as TweetInfo)
      .then(() => sendRespone({ status: 'success' }))
      .catch((reason) => {
        Sentry.captureException(reason)
        sendRespone({ status: 'error', data: reason })
      })

    return true // keep message channel open
  }
})

chrome.runtime.onInstalled.addListener(async details => {
  const reason = details.reason
  const previousVersion = details.previousVersion

  if (reason === InstallReason.Install) await initStorage()
  if (reason === InstallReason.Update) {
    showUpdateMessageInConsole(previousVersion)
    await migrateStorage()
  }

  openOptionsPage()
})

chrome.downloads.onChanged.addListener(async downloadDelta => {
  Sentry.addBreadcrumb({
    category: 'download',
    message: `Download state changed. (delta: ${downloadDelta})`,
    level: 'info',
  })

  const isBySelf = await isDownloadedBySelf(downloadDelta.id)
  if (!isBySelf) return false

  const isStateChanged = 'state' in downloadDelta

  if (isStateChanged && isDownloadedBySelf) {
    const { id, state, error } = downloadDelta

    if (DownloadStateUtil.isInterrupted(state)) {
      console.log('Download was interrupted.', downloadDelta)
      const eventTime = getDownloadDeltaEventTime(downloadDelta)

      await Statistics.addFailedDownloadCount()
      const { info } = await fetchDownloadItemRecord(id)
      Sentry.addBreadcrumb({
        category: 'download',
        message: `Download interupted reason. (current: ${error.current}, previous: ${error.previous})`,
        level: 'info',
      })
      Sentry.captureMessage(`Download interupted reason. (current: ${error.current}, previous: ${error.previous})`)

      if (info) notifyDownloadFailed(info, id, eventTime)
    }

    if (DownloadStateUtil.isCompleted(state)) {
      console.log('Download was completed.', downloadDelta)
      removeDownloadItemRecord(id)
      await Statistics.addSuccessDownloadCount()
    }
  }
})

chrome.downloads.onDeterminingFilename.addListener((downloadItem, suggest) => {
  const { byExtensionId } = downloadItem
  if (byExtensionId) {
    if (byExtensionId === getExtensionId()) {
      fetchDownloadItemRecord(downloadItem.id).then(record => {
        const { config } = record
        suggest(config as chrome.downloads.DownloadFilenameSuggestion)
      })
      return true
    }
  }
})

chrome.notifications.onClosed.addListener(async notifficationId => {
  if (DownloadRecordUtil.isValidId(notifficationId)) {
    const downloadItemId = DownloadRecordUtil.extractDownloadItemId(notifficationId)
    await removeDownloadItemRecord(downloadItemId)
  }
})

chrome.notifications.onClicked.addListener(async notifficationId => {
  openFailedTweetInNewTab(notifficationId)
})

chrome.notifications.onButtonClicked.addListener(
  async (notifficationId, buttonIndex) => {
    if (buttonIndex === 0) openFailedTweetInNewTab(notifficationId)
    if (buttonIndex === 1) retryDownload(notifficationId as DownloadRecordId)
  }
)

process.env.MANIFEST === '3'
  // @ts-expect-error lul
  ? chrome.action.onClicked.addListener(openOptionsPage)
  : chrome.browserAction.onClicked.addListener(openOptionsPage)


/* eslint-disable no-console */
function showUpdateMessageInConsole(previous: string) {
  const current = chrome.runtime.getManifest().version
  console.info('The extension has been updated.')
  console.info('Previous version:', previous)
  console.info('Current version:', current)
}
/* eslint-enable no-console */



async function openFailedTweetInNewTab(notifficationId: string) {
  // notificationId is tweet's id
  let tweetId = notifficationId
  if (DownloadRecordUtil.isValidId(notifficationId)) {
    const downloadItemId = DownloadRecordUtil.extractDownloadItemId(notifficationId)
    const { info } = await fetchDownloadItemRecord(downloadItemId)
    tweetId = info.tweetId
    await removeDownloadItemRecord(downloadItemId)
  }

  const url = `https://twitter.com/i/web/status/${tweetId}`
  chrome.tabs.create({ url: url })
}

async function fetchErrorHandler(
  tweetInfo: TweetInfo,
  reason: FetchErrorReason
) {
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

async function retryDownload(downloadRecordId: DownloadRecordId) {
  const downloadItemId = DownloadRecordUtil.extractDownloadItemId(downloadRecordId)
  const { info, config } = await fetchDownloadItemRecord(downloadItemId)
  await removeDownloadItemRecord(downloadItemId)
  const downloadRecorder = downloadItemRecorder(info)(config)
  chrome.downloads.download(config, downloadRecorder)
}

function getDownloadDeltaEventTime(downloadDelta: chrome.downloads.DownloadDelta) {
  const eventTime =
    !downloadDelta.error && 'current' in downloadDelta.endTime
      ? Date.parse(downloadDelta.endTime.current)
      : Date.now()

  return eventTime
}