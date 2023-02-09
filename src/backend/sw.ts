import * as Sentry from '@sentry/browser'
import { SENTRY_DSN } from '../constants'

Sentry.init({
  dsn: SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.3 : 0.8,
  environment: process.env.NODE_ENV,
  release: process.env.RELEASE
})


import MediaDownloader from './downloads/MediaDownloader'
import StatisticsUseCases from './statistics/useCases'
import { fetchMediaCatalog } from './twitterApi/MediaTweet'
import {
  getExtensionId,
  openOptionsPage,
} from '../libs/chromeApi'
import {
  isDownloadedBySelf,
  isInvalidInfo,
} from './utils/checker'
import { initStorage } from './commands/storage'
import { Action } from '../typings'
import { showUpdateMessageInConsole } from './commands/console'
import { FetchErrorNotificationUseCase, InternalErrorNotificationUseCase } from './notifications/notifyUseCase'
import NotificationUseCase from './notifications/notificationIdUseCase'
import DownloadStateUseCase from './downloads/downloadStateUseCase'
import { HarvestError, TwitterApiError } from './errors'
import { storageConfig } from './configurations'


const enum InstallReason {
  Install = 'install',
  Update = 'update',
}


const statisticsUsecases = new StatisticsUseCases(storageConfig.statisticsRepo)
const downloadRecordRepo = storageConfig.downloadRecordRepo

/* eslint-disable no-console */
const processDownloadAction = async (
  tweetInfo: TweetInfo,
  onSuccess: CallableFunction,
  onError: CallableFunction
) => {
  if (isInvalidInfo(tweetInfo)) {
    console.error('Invalid tweetInfo.')
    await statisticsUsecases.addErrorCount()
    onError(new HarvestError(`Invalid tweetInfo. ${tweetInfo}`))
    return
  }

  console.info('Processing download. Info:', tweetInfo)
  Sentry.addBreadcrumb({
    category: 'download',
    message: 'Process download.',
    level: 'info',
  })

  try {
    const mediaDownloader = await MediaDownloader.build(tweetInfo)
    console.info(`Fetching media info (tweetId: ${tweetInfo.tweetId})...`)
    const mediaCatelog = await fetchMediaCatalog(tweetInfo.tweetId)
    mediaDownloader.downloadMediasByMediaCatalog(mediaCatelog)
    onSuccess()
  } catch (err) {
    Sentry.captureException(err)
    console.error('Error reason: ', err)
    onError(err)
  }
}
/* eslint-disable no-console */

chrome.runtime.onMessage.addListener((message: HarvestMessage, sender, sendRespone) => {
  if (message.action === Action.Download) {
    const onSuccess = () => sendRespone({ status: 'success' })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const onError = (err: any) => {
      sendRespone({ status: 'error', data: err })

      if (err instanceof TwitterApiError) {
        const fetchErrorUseCase = new FetchErrorNotificationUseCase(message.data)
        fetchErrorUseCase.notify(err)
      } else {
        const internalErrorNotifyUseCase = new InternalErrorNotificationUseCase(message.data)
        internalErrorNotifyUseCase.notify(err)
      }
    }

    processDownloadAction(message.data as TweetInfo, onSuccess, onError)
    return true // keep message channel open
  }
})

chrome.runtime.onInstalled.addListener(async details => {
  if (details.reason === InstallReason.Install) await initStorage()
  if (details.reason === InstallReason.Update) showUpdateMessageInConsole(details.previousVersion)
  openOptionsPage()
})

chrome.downloads.onChanged.addListener(async downloadDelta => {
  if (! await isDownloadedBySelf(downloadDelta.id)) return false

  Sentry.addBreadcrumb({
    category: 'download',
    message: `Download state changed. (delta: ${downloadDelta})`,
    level: 'info',
  })

  if ('state' in downloadDelta) {
    const downloadStateUseCase = new DownloadStateUseCase(
      downloadDelta,
      downloadRecordRepo,
    )
    await downloadStateUseCase.process()
  }
})

chrome.notifications.onClosed.addListener(async notifficationId => {
  const notificationUseCase = new NotificationUseCase(notifficationId)
  notificationUseCase.handle_close()

})

chrome.notifications.onClicked.addListener(async notifficationId => {
  const notificationUseCase = new NotificationUseCase(notifficationId)
  notificationUseCase.handle_click()
})

chrome.notifications.onButtonClicked.addListener(
  async (notifficationId, buttonIndex) => {
    const notificationUseCase = new NotificationUseCase(notifficationId)
    notificationUseCase.handle_button(buttonIndex)
  }
)

process.env.MANIFEST === '3'
  // @ts-expect-error lul
  ? chrome.action.onClicked.addListener(openOptionsPage)
  : chrome.browserAction.onClicked.addListener(openOptionsPage)


const ensureFilename = (
  downloadItem: chrome.downloads.DownloadItem,
  suggest: (suggestion?: chrome.downloads.DownloadFilenameSuggestion) => void
) => {
  const { byExtensionId } = downloadItem
  const runtimeId = getExtensionId()

  if (byExtensionId && byExtensionId === runtimeId) {
    downloadRecordRepo
      .getById(downloadItem.id)
      .then(record => {
        const { downloadConfig } = record
        suggest(downloadConfig as chrome.downloads.DownloadFilenameSuggestion)
      })
    return true
  } else if (byExtensionId && byExtensionId !== runtimeId) {
    return true
  }
  // if extensionId is undefined, it was trigger by the browser.
  suggest()
}


const removeSuggestion = () => {
  if (chrome.downloads.onDeterminingFilename.hasListener(ensureFilename)) {
    chrome.downloads.onDeterminingFilename.removeListener(ensureFilename)
  }
  console.log('Disable suggestion.')
}

const addSuggestion = () => {
  if (!chrome.downloads.onDeterminingFilename.hasListener(ensureFilename)) {
    chrome.downloads.onDeterminingFilename.addListener(ensureFilename)
  }
  console.log('Enable suggestion')
}

chrome.storage.onChanged.addListener(
  (changes, areaName) => {
    const AggressiveModeKey = 'aggressive_mode'
    if (AggressiveModeKey in changes) {
      changes[AggressiveModeKey].newValue ?
        addSuggestion() :
        removeSuggestion()
    }
  }
)

storageConfig.downloadSettingsRepo.getSettings().then(
  (downloadSettings) => {
    if (downloadSettings.aggressive_mode) addSuggestion()
  }
)
