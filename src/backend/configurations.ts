import { downloadDB } from '@libs/indexedDB'
import browser from 'webextension-polyfill'
import { ClientInfoRepository } from './client/repositories'
import { CredentialRepository } from './credentials/repositories'
import { IndexedDBDownloadRecordsRepository, StorageAreaDownloadRecordsRepository } from './downloads/repository'
import DownloadSettingsRepository from './settings/downloadSettings/repository'
import { FeaturesRepository } from './settings/featureSettings/repository'
import FilenameSettingsRepository, { V4FilenameSettingsRepository } from './settings/filenameSettings/repository'
import { TwitterApiSettingsRepository } from './settings/twitterApiSettings/repository'
import { V4StatisticsRepository } from './statistics/repositories'

class StorageConfiguration {
  readonly downloadRecordRepo = downloadDB.isSupported
    ? new IndexedDBDownloadRecordsRepository(async () => await downloadDB.connect())
    : new StorageAreaDownloadRecordsRepository(browser.storage.local)
  readonly statisticsRepo = new V4StatisticsRepository(browser.storage.local)
  readonly filenameSettingsRepo = new FilenameSettingsRepository(browser.storage.sync)
  readonly downloadSettingsRepo = new DownloadSettingsRepository(browser.storage.local)
  readonly featureSettingsRepo = new FeaturesRepository(browser.storage.local)
  readonly v4FilenameSettingsRepo = new V4FilenameSettingsRepository(browser.storage.sync)
  readonly twitterApiSettingsRepo = new TwitterApiSettingsRepository(browser.storage.local)
  readonly credentialsRepo = new CredentialRepository(browser.storage.sync)
  readonly clientInfoRepo = new ClientInfoRepository(browser.storage.local, {
    credentialProvider: async () => await this.credentialsRepo.getCredential(),
    statsProvider: async () => await this.statisticsRepo.getStats(),
  })
}

export const storageConfig = new StorageConfiguration()
