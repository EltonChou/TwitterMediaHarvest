import { downloadDB } from '@libs/indexedDB'
import { LocalExtensionStorageProxy, SyncExtensionStorageProxy } from '@libs/proxy'
import type { DownloadSettings, FeatureSettings, TwitterApiSettings, V4FilenameSettings } from '@schema'
import browser from 'webextension-polyfill'
import { ClientInfoRepository, IClientInfoRepository } from './client/repositories'
import { CredentialRepository, ICredentialRepository } from './credentials/repositories'
import {
  IDownloadRecordsRepository,
  IndexedDBDownloadRecordsRepository,
  StorageAreaDownloadRecordsRepository,
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

const localStorage = new LocalExtensionStorageProxy(browser.storage.local)
const syncStorage = new SyncExtensionStorageProxy(browser.storage.sync)

const downloadRecordRepo = downloadDB.isSupported
  ? new IndexedDBDownloadRecordsRepository(async () => await downloadDB.connect())
  : new StorageAreaDownloadRecordsRepository(browser.storage.local)
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
    readonly clientInfoRepo: IClientInfoRepository
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
  clientInfoRepo
)
