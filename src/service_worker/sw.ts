/* eslint-disable no-console */
import { ClientInfoUseCase } from '@backend/client/useCases'
import { showClientInfoInConsole, showUpdateMessageInConsole } from '@backend/commands/console'
import { initStorage, MigrateStorageToV4 } from '@backend/commands/storage'
import { storageConfig } from '@backend/configurations'
import DownloadActionUseCase from '@backend/downloads/downloadActionUseCase'
import DownloadStateUseCase from '@backend/downloads/downloadStateUseCase'
import { HarvestError } from '@backend/errors'
import NotificationUseCase from '@backend/notifications/notificationIdUseCases'
import { V4StatsUseCase } from '@backend/statistics/useCases'
import { isDownloadedBySelf, isInvalidInfo } from '@backend/utils/checker'
import { addBreadcrumb, captureException, init as SentryInit, setUser, type User } from '@sentry/browser'
import browser from 'webextension-polyfill'
import { Action } from '../enums'
import { chromiumInit, firefoxInit } from './initialization'

interface SentryUser extends User {
  client_id: string
}

const enum InstallReason {
  Install = 'install',
  Update = 'update',
  BrowserUpdate = 'browser_update',
}

const fetchUser = async (): Promise<SentryUser> => {
  const sentryUser: SentryUser = {
    id: 'NULL_ID',
    client_id: 'NULL_UUID',
  }

  try {
    const credential = await storageConfig.credentialsRepo.getCredential()
    const clientInfo = await storageConfig.clientInfoRepo.getInfo()

    sentryUser.id = credential.identityId
    sentryUser.client_id = clientInfo.props.uuid
  } catch (error) {
    console.error(error)
  }

  return sentryUser
}

const clientInfoUseCase = new ClientInfoUseCase(storageConfig.clientInfoRepo)

SentryInit({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.3 : 0.8,
  environment: process.env.NODE_ENV,
  release: process.env.RELEASE,
  ignoreErrors: ['Failed to fetch'],
})

fetchUser().then(user => setUser(user))

browser.runtime.onMessage.addListener(async (message: HarvestMessage<unknown>, sender, sendResponse) => {
  if (message.action === Action.Download) {
    if (isInvalidInfo(message.data as TweetInfo)) {
      console.error('Invalid tweetInfo.')
      return {
        status: 'error',
        data: new HarvestError(`Invalid tweetInfo. ${message.data}`),
      }
    }

    const usecase = new DownloadActionUseCase(message.data as TweetInfo)
    try {
      await usecase.processDownload()
      return { status: 'success' }
    } catch (error) {
      return { status: 'error', data: error }
    }
  }

  if (message.action === Action.FetchUser) {
    const user = await fetchUser()
    return { status: 'success', data: user }
  }

  sendResponse()

  return {
    status: 'error',
    data: new HarvestError(`Invalid message. ${message}`),
  }
})

browser.runtime.onInstalled.addListener(async details => {
  try {
    const info = await storageConfig.clientInfoRepo.getInfo()
    showClientInfoInConsole(info.props)
  } catch (error) {
    captureException(error)
    console.error(error)
  }

  if (details.reason === InstallReason.BrowserUpdate) return

  if (details.reason === InstallReason.Install) {
    await initStorage()
  }

  if (details.reason === InstallReason.Update) {
    const statsUseCase = new V4StatsUseCase(storageConfig.statisticsRepo)
    await statsUseCase.syncWithDownloadHistory()
    const migrateCommand = new MigrateStorageToV4()
    await migrateCommand.execute()
    showUpdateMessageInConsole(details.previousVersion)
  }
})

browser.downloads.onChanged.addListener(async downloadDelta => {
  if (!(await isDownloadedBySelf(downloadDelta.id))) return false

  addBreadcrumb({
    category: 'download',
    message: 'Download state changed.',
    level: 'info',
    data: {
      delta: downloadDelta,
    },
  })

  if ('state' in downloadDelta) {
    const downloadStateUseCase = new DownloadStateUseCase(downloadDelta, storageConfig.downloadRecordRepo)
    await downloadStateUseCase.process()
    await clientInfoUseCase.sync()
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

process.env.TARGET === 'firefox'
  ? firefoxInit()
  : chromiumInit(storageConfig.downloadSettingsRepo, storageConfig.downloadRecordRepo)