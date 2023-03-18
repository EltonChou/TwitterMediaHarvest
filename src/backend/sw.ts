/* eslint-disable no-console */
import * as Sentry from '@sentry/browser'
import { SENTRY_DSN } from '../constants'

Sentry.init({
  dsn: SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.3 : 0.8,
  environment: process.env.NODE_ENV,
  release: process.env.RELEASE,
})

import StatisticsUseCases from './statistics/useCases'
import { openOptionsPage } from '../libs/chromeApi'
import { isDownloadedBySelf, isInvalidInfo } from './utils/checker'
import { initStorage } from './commands/storage'
import { Action } from '../typings'
import { showUpdateMessageInConsole } from './commands/console'
import NotificationUseCase from './notifications/notificationIdUseCase'
import DownloadStateUseCase from './downloads/downloadStateUseCase'
import { HarvestError } from './errors'
import { storageConfig } from './configurations'
import DownloadActionUseCase from './downloads/downloadActionUseCase'
import browser from 'webextension-polyfill'
import { chromium_init, firefox_init } from './initialization'

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
  return false
})

browser.runtime.onInstalled.addListener(async details => {
  if (details.reason === InstallReason.Install) await initStorage()
  if (details.reason === InstallReason.Update) showUpdateMessageInConsole(details.previousVersion)
  openOptionsPage()
})

browser.downloads.onChanged.addListener(async downloadDelta => {
  if (!(await isDownloadedBySelf(downloadDelta.id))) return false

  Sentry.addBreadcrumb({
    category: 'download',
    message: `Download state changed. (delta: ${downloadDelta})`,
    level: 'info',
  })

  if ('state' in downloadDelta) {
    const downloadStateUseCase = new DownloadStateUseCase(downloadDelta, storageConfig.downloadRecordRepo)
    await downloadStateUseCase.process()
  }
})

browser.notifications.onClosed.addListener(notifficationId => {
  const notificationUseCase = new NotificationUseCase(notifficationId)
  notificationUseCase.handle_close()
})

browser.notifications.onClicked.addListener(notifficationId => {
  const notificationUseCase = new NotificationUseCase(notifficationId)
  notificationUseCase.handle_click()
})

browser.notifications.onButtonClicked.addListener((notifficationId, buttonIndex) => {
  const notificationUseCase = new NotificationUseCase(notifficationId)
  notificationUseCase.handle_button(buttonIndex)
})

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
browser.action.onClicked.addListener(openOptionsPage)

process.env.TARGET !== 'firefox'
  ? chromium_init(storageConfig.downloadSettingsRepo, storageConfig.downloadRecordRepo)
  : firefox_init()
