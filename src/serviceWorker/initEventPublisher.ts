/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { DomainEventPublisher } from '#domain/eventPublisher'
import {
  checkCompletedDownload,
  cleanDownloadRecord as cleanDownloadRecordHandler,
  increaseUsageStatistics,
  initClient,
  notifyDownloadInterrupted,
  notifyFilenameIsOverwritten,
  notifyTweetApiError,
  openFailedTweetInNewTab,
  openTweetOfFailedDownloadInNewTab,
  recordDispatchedDownloadConfiguration,
  retryFailedDownload,
  setMonitorUser,
  showClientInfoInConsole,
  showUpdateMessageInConsole,
  syncClient,
  updateSolutionQuota,
  warnInsufficientNativeSolutionQuota,
} from '#eventHandlers'
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
  nativeFetchTweetSolution,
  solutionQuotaRepo,
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
      setUser,
      async () => await nativeFetchTweetSolution.clearCacheStorage(),
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
    .register('download:status:failed:browser', [
      // TODO: Handle brower download failed event
    ])
    .register('tweetSolution:quota:insufficient', [
      warnInsufficientNativeSolutionQuota(solutionQuotaRepo, notifier),
    ])
    .register('tweetSolution:quota:changed', [
      updateSolutionQuota(solutionQuotaRepo),
    ])
}

export default initEventPublisher
