import { DomainEventPublisher } from '#domain/eventPublisher'
import { checkCompletedDownload } from '#eventHandlers/checkCompletedDownload'
import { cleanDownloadRecord as cleanDownloadRecordHandler } from '#eventHandlers/cleanDownloadRecord'
import { increaseUsageStatistics } from '#eventHandlers/increaseUsageStatistics'
import { initClient } from '#eventHandlers/initClient'
import { notifyDownloadInterrupted } from '#eventHandlers/notifyDownloadInterrupted'
import { notifyTweetApiError } from '#eventHandlers/notifyTweetApiError'
import { openFailedTweetInNewTab } from '#eventHandlers/openFailedTweetInNewTab'
import { openTweetOfFailedDownloadInNewTab } from '#eventHandlers/openTweetOfFailedDownloadInNewTab'
import { recordDispatchedDownloadConfiguration } from '#eventHandlers/recordDispatchedDownloadConfiguration'
import { retryFailedDownload } from '#eventHandlers/retryFailedDownload'
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
} from '#provider'
import { runtime } from 'webextension-polyfill'

const initEventPublisher = (eventPublisher?: DomainEventPublisher) => {
  const publisher = eventPublisher ?? getEventPublisher()
  const notifier = getNotifier()

  const cleanDownloadRecord = cleanDownloadRecordHandler(downloadRecordRepo)

  publisher
    .register('runtime:status:installed', [
      initClient(clientRepo, runtime.setUninstallURL),
      showClientInfoInConsole(clientRepo),
    ])
    .register('runtime:status:updated', [
      showUpdateMessageInConsole,
      showClientInfoInConsole(clientRepo),
    ])
    .register('download:status:dispatched:browser', [
      recordDispatchedDownloadConfiguration(downloadRecordRepo),
    ])
    .register('download:status:completed', [
      checkCompletedDownload(downloadRepo, downloadRecordRepo),
      increaseUsageStatistics(usageStatisticsRepo, downloadRepo),
      syncClient(runWithWebLock(LockCriteria.ClientSync))(clientRepo),
      cleanDownloadRecord,
    ])
    .register('download:status:interrupted', [
      notifyDownloadInterrupted(notifier, downloadRecordRepo),
    ])
    .register('filename:overwritten', [
      //TODO: Notify user that the filename was overwritten.
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
}

export default initEventPublisher
