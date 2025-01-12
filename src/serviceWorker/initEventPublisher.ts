import { DomainEventPublisher } from '#domain/eventPublisher'
import { checkCompletedDownload } from '#eventHandlers/checkCompletedDownload'
import { cleanDownloadRecord as cleanDownloadRecordHandler } from '#eventHandlers/cleanDownloadRecord'
import { increaseUsageStatistics } from '#eventHandlers/increaseUsageStatistics'
import { initClient } from '#eventHandlers/initClient'
import { notifyDownloadInterrupted } from '#eventHandlers/notifyDownloadInterrupted'
import { notifyFilenameIsOverwritten } from '#eventHandlers/notifyFilenameIsOverwritten'
import { notifyTweetApiError } from '#eventHandlers/notifyTweetApiError'
import { openFailedTweetInNewTab } from '#eventHandlers/openFailedTweetInNewTab'
import { openTweetOfFailedDownloadInNewTab } from '#eventHandlers/openTweetOfFailedDownloadInNewTab'
import { recordDispatchedDownloadConfiguration } from '#eventHandlers/recordDispatchedDownloadConfiguration'
import { retryFailedDownload } from '#eventHandlers/retryFailedDownload'
import { setMonitorUser } from '#eventHandlers/setMonitorUser'
import { showClientInfoInConsole } from '#eventHandlers/showClientInfoInConsole'
import { showUpdateMessageInConsole } from '#eventHandlers/showUpdateMessageInConsole'
import { syncClient } from '#eventHandlers/syncClient'
import { getNotifier } from '#infra/browserNotifier'
import { getEventPublisher } from '#infra/eventPublisher'
import { BrowserDownloadMediaFile } from '#infra/useCases/browserDownloadMediaFile'
import LockCriteria from '#libs/locks/enums'
import { runWithWebLock } from '#libs/locks/nativeWebLock'
import {
  clientRepo,
  downloadRecordRepo,
  downloadRepo,
  downloadSettingsRepo,
  usageStatisticsRepo,
  warningSettingsRepo,
} from '#provider'
import { runtime } from 'webextension-polyfill'

const initEventPublisher = (eventPublisher?: DomainEventPublisher) => {
  const publisher = eventPublisher ?? getEventPublisher()
  const notifier = getNotifier()

  const cleanDownloadRecord = cleanDownloadRecordHandler(downloadRecordRepo)
  const increaseUsageStats = increaseUsageStatistics(
    usageStatisticsRepo,
    downloadRepo
  )
  const syncClientInfoWithLock = syncClient(
    runWithWebLock(LockCriteria.ClientSync)
  )(clientRepo)
  const setUser = setMonitorUser(clientRepo)

  publisher
    .register('runtime:status:installed', [
      initClient(clientRepo, runtime.setUninstallURL),
      showClientInfoInConsole(clientRepo),
      setUser,
    ])
    .register('runtime:status:updated', [
      showUpdateMessageInConsole,
      showClientInfoInConsole(clientRepo),
    ])
    .register('download:status:dispatched:aria2', [
      increaseUsageStats,
      syncClientInfoWithLock,
    ])
    .register('download:status:dispatched:browser', [
      recordDispatchedDownloadConfiguration(downloadRecordRepo),
    ])
    .register('download:status:completed', [
      checkCompletedDownload(downloadRepo, downloadRecordRepo),
      increaseUsageStats,
      syncClientInfoWithLock,
      cleanDownloadRecord,
    ])
    .register('download:status:interrupted', [
      notifyDownloadInterrupted(notifier, downloadRecordRepo),
    ])
    .register('filename:overwritten', [
      notifyFilenameIsOverwritten(notifier, warningSettingsRepo),
    ])
    .register('api:twitter:failed', [notifyTweetApiError(notifier)])
    .register('parse:tweet:failed', [
      /** TODO: Notify user that tweet parsing is failed. */
    ])
    .register('notification:downloadFailed:self:closed', cleanDownloadRecord)
    .register('notification:downloadFailed:retryButton:clicked', [
      retryFailedDownload(
        downloadSettingsRepo,
        downloadRecordRepo,
        params =>
          new BrowserDownloadMediaFile(params.targetTweet, params.shouldPrompt)
      ),
      cleanDownloadRecord,
    ])
    .register('notification:downloadFailed:viewButton:clicked', [
      openTweetOfFailedDownloadInNewTab(downloadRecordRepo),
      cleanDownloadRecord,
    ])
    .register('notification:tweetFetchError:self:closed', [])
    .register(
      'notification:tweetFetchError:self:clicked',
      openFailedTweetInNewTab
    )
    .register(
      'notification:tweetFetchError:viewButton:clicked',
      openFailedTweetInNewTab
    )
    .register('client:synced', setUser)
}

export default initEventPublisher
