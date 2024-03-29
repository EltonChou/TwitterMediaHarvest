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
import DownloadActionUseCase from '@backend/downloads/useCases/downloadActionUseCase'
import DownloadHistoryUseCase from '@backend/downloads/useCases/downloadHistoryUseCase'
import DownloadRecordUseCase from '@backend/downloads/useCases/downloadRecordUseCase'
import DownloadStateUseCase from '@backend/downloads/useCases/downloadStateUseCase'
import { HarvestError } from '@backend/errors'
import NotificationUseCase from '@backend/notifications/notificationIdUseCases'
import { V4StatsUseCase } from '@backend/statistics/useCases'
import { shouldHandleDownloadDelta } from '@backend/utils/checker'
import '@init'
import {
  Action,
  type ExchangeHandler,
  type HarvestExchange,
  type HarvestResponse,
} from '@libs/browser'
import {
  init as SentryInit,
  type User,
  addBreadcrumb,
  captureException,
  setUser,
} from '@sentry/browser'
import { toError } from 'fp-ts/lib/Either'
import * as TE from 'fp-ts/lib/TaskEither'
import { pipe } from 'fp-ts/lib/function'
import browser from 'webextension-polyfill'

interface SentryUser extends User {
  client_id: string
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
  ignoreErrors: [
    'Failed to fetch',
    'network error',
    'Download canceled by the user',
    'intermediate value',
  ],
})

fetchUser().then(user => setUser(user))

const handleDownload: ExchangeHandler<Action.Download> = async ({ data }) => {
  const usecase = new DownloadActionUseCase(data)
  const result = await usecase.processDownload()
  return { status: result }
}

const handleUserFetch: ExchangeHandler<Action.FetchUser> = async exchange => {
  const sentryUser = await fetchUser()
  return { status: 'success', data: sentryUser }
}

const handleCheckDlHistory: ExchangeHandler<
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

const handleExportHistory: ExchangeHandler<Action.ExportHistory> = async exchange => {
  try {
    const useCase = new DownloadHistoryUseCase(downloadHistoryRepo)
    await useCase.export()
    return { status: 'success' }
  } catch (error) {
    return { status: 'error', error: error }
  }
}

const handleImportHistory: ExchangeHandler<Action.ImportHistory> = async exchange => {
  try {
    const useCase = new DownloadHistoryUseCase(downloadHistoryRepo)
    const history = await useCase.parse(exchange.data)
    await useCase.import(history.items)
    return { status: 'success' }
  } catch (error) {
    return { status: 'error', error: error }
  }
}

const handleRetryAll: ExchangeHandler<Action.RetryAll> = async exchange => {
  try {
    const useCase = new DownloadRecordUseCase(downloadRecordRepo)
    await useCase.retryAll()
    return { status: 'success' }
  } catch (error) {
    return { status: 'error', error: error }
  }
}

browser.runtime.onMessage.addListener(
  async (
    message: HarvestExchange<Action>,
    sender,
    sendResponse
  ): Promise<HarvestResponse<Action>> => {
    if (message.action === Action.CheckDownloadHistory)
      return handleCheckDlHistory(message)
    if (message.action === Action.Download) return handleDownload(message)
    if (message.action === Action.FetchUser) return handleUserFetch(message)
    if (message.action === Action.ExportHistory) return handleExportHistory(message)
    if (message.action === Action.ImportHistory) return handleImportHistory(message)
    if (message.action === Action.RetryAll) return handleRetryAll(message)

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

  if (details.reason === 'browser_update') return

  if (details.reason === 'install') {
    await initStorage()
  }

  if (details.reason === 'update') {
    const statsUseCase = new V4StatsUseCase(statisticsRepo)
    const migrateCommand = new MigrateStorageToV4()
    await statsUseCase.syncWithDownloadHistory()
    await migrateCommand.execute()
    showUpdateMessageInConsole(details.previousVersion)
  }
})

browser.downloads.onChanged.addListener(async downloadDelta => {
  if (!(await shouldHandleDownloadDelta(downloadDelta.id))) return false

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
