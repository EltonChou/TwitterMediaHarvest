import { IDBDownloadHistoryRepository } from '#infra/repositories/IDBDownloadHistory'
import { IDBDownloadRecordRepository } from '#infra/repositories/IDBDownloadRecord'
import { IDBPortableDownloadHistoryRepository } from '#infra/repositories/IDBPortableDownloadHistory'
import { AWSClientRepository } from '#infra/repositories/awsClient'
import { AWSCredentialRepository } from '#infra/repositories/awsCredential'
import { BrowserDownloadRepository } from '#infra/repositories/browserDownload'
import { DownloadSettingsRepository } from '#infra/repositories/downloadSettings'
import { FeatureSettingsRepository } from '#infra/repositories/featureSettings'
import { V4FilenameSettingsRepository } from '#infra/repositories/filenameSettings'
import { WebExtUsageStatisticsRepository } from '#infra/repositories/usageStatistics'
import { XTokenRepo } from '#infra/repositories/xToken'
import { downloadIDB } from '#libs/idb/download/db'
import { blobToUrlWithFileReader } from '#utils/blob'
import { awsClient } from './client'
import { localWebExtStorage, syncWebExtStorage } from './proxy'

export const downloadRepo = new BrowserDownloadRepository()
export const xTokenRepo = new XTokenRepo()

// Sync
export const filenameSettingsRepo = new V4FilenameSettingsRepository(syncWebExtStorage)

// Local
export const clientRepo = new AWSClientRepository(awsClient, localWebExtStorage)
export const downloadSettingsRepo = new DownloadSettingsRepository(localWebExtStorage)
export const featureSettingsRepo = new FeatureSettingsRepository(localWebExtStorage)
export const usageStatisticsRepo = new WebExtUsageStatisticsRepository(localWebExtStorage)

export const downloadHistoryRepo = new IDBDownloadHistoryRepository(downloadIDB)
export const downloadRecordRepo = new IDBDownloadRecordRepository(downloadIDB)
export const portableDownloadRepo = new IDBPortableDownloadHistoryRepository(
  downloadIDB,
  blobToUrlWithFileReader
)
