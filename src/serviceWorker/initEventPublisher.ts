/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { DomainEventPublisher } from '#domain/eventPublisher'
import {
  checkCompletedDownload,
  cleanDownloadRecord as cleanDownloadRecordHandler,
  ignoreFilenameOverwritten,
  increaseUsageStatistics,
  initClient,
  notifyDownloadInterrupted,
  notifyFilenameIsOverwritten,
  notifyTweetApiError,
  openDiagnosticsPageInNewTab,
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
import { countEvent } from '#eventHandlers/countEvent'
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
import { getVersion } from '#utils/runtime'
import { metrics } from '@sentry/browser'
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
      // !!Reset warning settings to show the filename overwritten notification for v4.5.0
      async () =>
        await warningSettingsRepo.save({ ignoreFilenameOverwritten: false }),
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
    .register('notification:filenameOverwritten:diagnoseButton:clicked', [
      openDiagnosticsPageInNewTab,
    ])
    .register('notification:filenameOverwritten:ignoreButton:clicked', [
      ignoreFilenameOverwritten(warningSettingsRepo),
    ])
    .register('notification:filenameOverwritten:self:clicked', [
      openDiagnosticsPageInNewTab,
    ])

  if (__METRICS__) {
    publisher
      .register('runtime:status:installed', () =>
        metrics.count('extension.installed', 1, {
          attributes: { version: getVersion() },
        })
      )
      .register('runtime:status:updated', e =>
        metrics.count('extension.updated', 1, {
          attributes: {
            version: { to: e.currentVersion, from: e.previousVersion },
          },
        })
      )
      .register('filename:overwritten', countEvent('filename.overwritten'))
      .register(
        'notification:filenameOverwritten:diagnoseButton:clicked',
        countEvent('notification.filenameOverwritten.diagnoseButton.clicked')
      )
      .register(
        'notification:filenameOverwritten:ignoreButton:clicked',
        countEvent('notification.filenameOverwritten.ignoreButton.clicked')
      )
      .register(
        'notification:filenameOverwritten:self:clicked',
        countEvent('notification.filenameOverwritten.self.clicked')
      )
  }
}

export default initEventPublisher
