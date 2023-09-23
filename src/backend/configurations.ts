import { ClientInfoRepository } from './client/repositories'
import { CredentialRepository } from './credentials/repositories'
import {
  IndexedDBDownloadHistoryRepository,
  IndexedDBDownloadRecordsRepository,
  IndexedDBHashtagRepository,
} from './downloads/repositories'
import DownloadSettingsRepository from './settings/downloadSettings/repository'
import { FeaturesRepository } from './settings/featureSettings/repository'
import FilenameSettingsRepository, {
  V4FilenameSettingsRepository,
} from './settings/filenameSettings/repository'
import { TwitterApiSettingsRepository } from './settings/twitterApiSettings/repository'
import { V4StatisticsRepository } from './statistics/repositories'
import { downloadDB } from '@libs/indexedDB'
import { LocalExtensionStorageProxy, SyncExtensionStorageProxy } from '@libs/proxy'
import browser from 'webextension-polyfill'

const localStorage = new LocalExtensionStorageProxy()
const syncStorage = new SyncExtensionStorageProxy()

export const downloadRecordRepo = new IndexedDBDownloadRecordsRepository(
  async () => await downloadDB.connect()
)
export const downloadHistoryRepo = new IndexedDBDownloadHistoryRepository(
  async () => await downloadDB.connect()
)
export const hashtagRepo = new IndexedDBHashtagRepository(
  async () => await downloadDB.connect()
)

export const statisticsRepo = new V4StatisticsRepository(localStorage)
export const filenameSettingsRepo = new FilenameSettingsRepository(browser.storage.sync)
export const downloadSettingsRepo = new DownloadSettingsRepository(localStorage)
export const featureSettingsRepo = new FeaturesRepository(localStorage)
export const v4FilenameSettingsRepo = new V4FilenameSettingsRepository(syncStorage)
export const twitterApiSettingsRepo = new TwitterApiSettingsRepository(localStorage)
export const credentialsRepo = new CredentialRepository(syncStorage)
export const clientInfoRepo = new ClientInfoRepository(localStorage, {
  credentialProvider: async () => await credentialsRepo.getCredential(),
  statsProvider: async () => await statisticsRepo.getStats(),
})
