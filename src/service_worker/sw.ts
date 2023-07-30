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
import { isDownloadedBySelf, isValidInfo } from '@backend/utils/checker'
import { Action, type HandleExchange, type HarvestExchange, HarvestResponse } from '@libs/browser'
import { addBreadcrumb, captureException, init as SentryInit, setUser, type User } from '@sentry/browser'
import browser from 'webextension-polyfill'
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

const handleDownload: HandleExchange<Action.Download> = async exchange => {
  if (!isValidInfo(exchange.data)) {
    console.error('Invalid tweetInfo.')
    return {
      status: 'error',
      error: new HarvestError(`Invalid tweetInfo. ${exchange.data}`),
    }
  }

  const usecase = new DownloadActionUseCase(exchange.data)
  try {
    await usecase.processDownload()
    return { status: 'success' }
  } catch (error) {
    return { status: 'error', error: error }
  }
}

const handleUserFetch: HandleExchange<Action.FetchUser> = async exchange => {
  const user = await fetchUser()
  return { status: 'success', data: user }
}

browser.runtime.onMessage.addListener(
  async (message: HarvestExchange<Action>, sender, sendResponse): Promise<HarvestResponse<Action>> => {
    if (message.action === Action.Download) return handleDownload(message)
    if (message.action === Action.FetchUser) return handleUserFetch(message)
    return {
      status: 'error',
      error: new HarvestError(`Invalid message. ${message}`),
    }
  }
)

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
  notificationUseCase.handleClose()
})

browser.notifications.onClicked.addListener(notifficationId => {
  const notificationUseCase = new NotificationUseCase(notifficationId)
  notificationUseCase.handleClick()
})

browser.notifications.onButtonClicked.addListener((notifficationId, buttonIndex) => {
  const notificationUseCase = new NotificationUseCase(notifficationId)
  notificationUseCase.handleButton(buttonIndex)
})

process.env.TARGET === 'firefox'
  ? firefoxInit()
  : chromiumInit(storageConfig.downloadSettingsRepo, storageConfig.downloadRecordRepo)
