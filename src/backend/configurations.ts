import { downloadDB } from '@libs/indexedDB'
import { LocalExtensionStorageProxy, SyncExtensionStorageProxy } from '@libs/proxy'
import type { DownloadSettings, FeatureSettings, TwitterApiSettings, V4FilenameSettings } from '@schema'
import browser from 'webextension-polyfill'
import { ClientInfoRepository, IClientInfoRepository } from './client/repositories'
import { CredentialRepository, ICredentialRepository } from './credentials/repositories'
import {
  IndexedDBDownloadHistoryRepository,
  IndexedDBDownloadRecordsRepository,
  type IDownloadHistoryRepository,
  type IDownloadRecordsRepository,
} from './downloads/repositories'
import DownloadSettingsRepository from './settings/downloadSettings/repository'
import { FeaturesRepository } from './settings/featureSettings/repository'
import FilenameSettingsRepository, {
  FilenameSettings,
  V4FilenameSettingsRepository,
} from './settings/filenameSettings/repository'
import type { ISettingsRepository } from './settings/repository'
import { TwitterApiSettingsRepository } from './settings/twitterApiSettings/repository'
import { IStatisticsRepositoryV4, V4StatisticsRepository } from './statistics/repositories'

const localStorage = new LocalExtensionStorageProxy()
const syncStorage = new SyncExtensionStorageProxy()

const downloadRecordRepo = new IndexedDBDownloadRecordsRepository(async () => await downloadDB.connect())
const downloadHistoryRepo = new IndexedDBDownloadHistoryRepository(async () => await downloadDB.connect())
const statisticsRepo = new V4StatisticsRepository(localStorage)
const filenameSettingsRepo = new FilenameSettingsRepository(browser.storage.sync)
const downloadSettingsRepo = new DownloadSettingsRepository(localStorage)
const featureSettingsRepo = new FeaturesRepository(localStorage)
const v4FilenameSettingsRepo = new V4FilenameSettingsRepository(syncStorage)
const twitterApiSettingsRepo = new TwitterApiSettingsRepository(localStorage)
const credentialsRepo = new CredentialRepository(syncStorage)
const clientInfoRepo = new ClientInfoRepository(localStorage, {
  credentialProvider: async () => await credentialsRepo.getCredential(),
  statsProvider: async () => await statisticsRepo.getStats(),
})

class StorageConfiguration {
  constructor(
    readonly downloadRecordRepo: IDownloadRecordsRepository,
    readonly statisticsRepo: IStatisticsRepositoryV4,
    readonly filenameSettingsRepo: ISettingsRepository<FilenameSettings>,
    readonly downloadSettingsRepo: ISettingsRepository<DownloadSettings>,
    readonly featureSettingsRepo: ISettingsRepository<FeatureSettings>,
    readonly v4FilenameSettingsRepo: ISettingsRepository<V4FilenameSettings>,
    readonly twitterApiSettingsRepo: ISettingsRepository<TwitterApiSettings>,
    readonly credentialsRepo: ICredentialRepository,
    readonly clientInfoRepo: IClientInfoRepository,
    readonly downloadHistoryRepo: IDownloadHistoryRepository
  ) {}
}

export const storageConfig = new StorageConfiguration(
  downloadRecordRepo,
  statisticsRepo,
  filenameSettingsRepo,
  downloadSettingsRepo,
  featureSettingsRepo,
  v4FilenameSettingsRepo,
  twitterApiSettingsRepo,
  credentialsRepo,
  clientInfoRepo,
  downloadHistoryRepo
)
