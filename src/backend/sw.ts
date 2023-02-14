/* eslint-disable no-console */
import * as Sentry from '@sentry/browser'
import { SENTRY_DSN } from '../constants'

Sentry.init({
  dsn: SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.3 : 0.8,
  environment: process.env.NODE_ENV,
  release: process.env.RELEASE
})


import StatisticsUseCases from './statistics/useCases'
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
import NotificationUseCase from './notifications/notificationIdUseCase'
import DownloadStateUseCase from './downloads/downloadStateUseCase'
import { HarvestError } from './errors'
import { storageConfig } from './configurations'
import DownloadActionUseCase from './downloads/downloadActionUseCase'


const enum InstallReason {
  Install = 'install',
  Update = 'update',
}

chrome.runtime.onMessage.addListener((message: HarvestMessage, sender, sendRespone) => {
  const statisticsUsecases = new StatisticsUseCases(storageConfig.statisticsRepo)
  if (message.action === Action.Download) {
    if (isInvalidInfo(message.data)) {
      console.error('Invalid tweetInfo.')
      statisticsUsecases.addErrorCount()
      sendRespone({ status: 'error', data: new HarvestError(`Invalid tweetInfo. ${message.data}`) })
      return
    }

    const usecase = new DownloadActionUseCase(message.data as TweetInfo)
    const onSuccess = () => sendRespone({ status: 'success' })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const onError = (err: Error) => sendRespone({ status: 'error', data: err })
    usecase.processDownload(onSuccess, onError)
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
      storageConfig.downloadRecordRepo,
    )
    await downloadStateUseCase.process()
  }
})

chrome.notifications.onClosed.addListener(notifficationId => {
  const notificationUseCase = new NotificationUseCase(notifficationId)
  notificationUseCase.handle_close()

})

chrome.notifications.onClicked.addListener(notifficationId => {
  const notificationUseCase = new NotificationUseCase(notifficationId)
  notificationUseCase.handle_click()
})

chrome.notifications.onButtonClicked.addListener(
  (notifficationId, buttonIndex) => {
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
    storageConfig.downloadRecordRepo
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
