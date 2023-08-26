/* eslint-disable no-console */
import { ClientInfoUseCase } from '@backend/client/useCases'
import {
  showClientInfoInConsole,
  showUpdateMessageInConsole,
} from '@backend/commands/console'
import { MigrateStorageToV4, initStorage } from '@backend/commands/storage'
import {
  clientInfoRepo,
  credentialsRepo,
  downloadHistoryRepo,
  downloadRecordRepo,
  statisticsRepo,
} from '@backend/configurations'
import DownloadActionUseCase from '@backend/downloads/downloadActionUseCase'
import DownloadStateUseCase from '@backend/downloads/downloadStateUseCase'
import { HarvestError } from '@backend/errors'
import NotificationUseCase from '@backend/notifications/notificationIdUseCases'
import { V4StatsUseCase } from '@backend/statistics/useCases'
import { isDownloadedBySelf } from '@backend/utils/checker'
import '@init'
import {
  Action,
  HarvestResponse,
  type HandleExchange,
  type HarvestExchange,
} from '@libs/browser'
import {
  init as SentryInit,
  addBreadcrumb,
  captureException,
  setUser,
  type User,
} from '@sentry/browser'
import { toError } from 'fp-ts/lib/Either'
import * as TE from 'fp-ts/lib/TaskEither'
import { pipe } from 'fp-ts/lib/function'
import browser from 'webextension-polyfill'

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
    const credential = await credentialsRepo.getCredential()
    const clientInfo = await clientInfoRepo.getInfo()

    sentryUser.id = credential.identityId
    sentryUser.client_id = clientInfo.props.uuid
  } catch (error) {
    console.error(error)
  }

  return sentryUser
}

const clientInfoUseCase = new ClientInfoUseCase(clientInfoRepo)

SentryInit({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.3 : 0.8,
  environment: process.env.NODE_ENV,
  release: process.env.RELEASE,
  ignoreErrors: ['Failed to fetch', 'network error', 'Download canceled by the user'],
})

fetchUser().then(user => setUser(user))

const handleDownload: HandleExchange<Action.Download> = async ({ data }) => {
  const usecase = new DownloadActionUseCase(data)
  const result = await usecase.processDownload()
  return { status: result }
}

const handleUserFetch: HandleExchange<Action.FetchUser> = async exchange => {
  const sentryUser: SentryUser = {
    id: 'NULL_ID',
    client_id: 'NULL_UUID',
  }

  try {
    const credential = await credentialsRepo.getCredential()
    const clientInfo = await clientInfoRepo.getInfo()

    sentryUser.id = credential.identityId
    sentryUser.client_id = clientInfo.props.uuid
  } catch (error) {
    console.error(error)
  }

  return { status: 'success', data: sentryUser }
}

const handleCheckDlHistory: HandleExchange<
  Action.CheckDownloadHistory
> = async exchange => {
  const isDownloaded = await pipe(
    TE.tryCatch(() => downloadHistoryRepo.tweetHasDownloaded(exchange.data), toError),
    TE.match(
      () => false,
      r => r
    )
  )()

  return {
    status: 'success',
    data: isDownloaded,
  }
}

browser.runtime.onMessage.addListener(
  async (
    message: HarvestExchange<Action>,
    sender,
    sendResponse
  ): Promise<HarvestResponse<Action>> => {
    if (message.action === Action.Download) return handleDownload(message)
    if (message.action === Action.FetchUser) return handleUserFetch(message)
    if (message.action === Action.CheckDownloadHistory)
      return handleCheckDlHistory(message)
    return {
      status: 'error',
      error: new HarvestError(`Invalid message. ${message}`),
    }
  }
)

browser.runtime.onInstalled.addListener(async details => {
  try {
    const info = await clientInfoRepo.getInfo()
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
    const statsUseCase = new V4StatsUseCase(statisticsRepo)
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
    const downloadStateUseCase = new DownloadStateUseCase(
      downloadDelta,
      downloadRecordRepo
    )
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
