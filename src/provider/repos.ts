/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { IDBDownloadHistoryRepository } from '#infra/repositories/IDBDownloadHistory'
import { IDBDownloadRecordRepository } from '#infra/repositories/IDBDownloadRecord'
import { IDBPortableDownloadHistoryRepository } from '#infra/repositories/IDBPortableDownloadHistory'
import { AWSClientRepository } from '#infra/repositories/awsClient'
import { BrowserDownloadRepository } from '#infra/repositories/browserDownload'
import { DownloadSettingsRepository } from '#infra/repositories/downloadSettings'
import { FeatureSettingsRepository } from '#infra/repositories/featureSettings'
import { V4FilenameSettingsRepository } from '#infra/repositories/filenameSettings'
import { SolutionQuotaRepository } from '#infra/repositories/solutionQuota'
import { WebExtUsageStatisticsRepository } from '#infra/repositories/usageStatistics'
import { WarningSettingsRepo } from '#infra/repositories/warningSettings'
import { XTokenRepo } from '#infra/repositories/xToken'
import { downloadIDB } from '#libs/idb/download/db'
import { awsClient } from './client'
import { localWebExtStorage, syncWebExtStorage } from './proxy'

export const downloadRepo = new BrowserDownloadRepository()
export const xTokenRepo = new XTokenRepo()

// Sync
export const filenameSettingsRepo = new V4FilenameSettingsRepository(
  syncWebExtStorage
)

// Local
export const clientRepo = new AWSClientRepository(awsClient, localWebExtStorage)
export const downloadSettingsRepo = new DownloadSettingsRepository(
  localWebExtStorage
)
export const featureSettingsRepo = new FeatureSettingsRepository(
  localWebExtStorage
)
export const usageStatisticsRepo = new WebExtUsageStatisticsRepository(
  localWebExtStorage
)

export const downloadHistoryRepo = new IDBDownloadHistoryRepository(downloadIDB)
export const downloadRecordRepo = new IDBDownloadRecordRepository(downloadIDB)
export const portableDownloadRepo = new IDBPortableDownloadHistoryRepository(
  downloadIDB
)
export const warningSettingsRepo = new WarningSettingsRepo(localWebExtStorage)
export const solutionQuotaRepo = new SolutionQuotaRepository(localWebExtStorage)
