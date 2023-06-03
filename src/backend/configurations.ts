import browser from 'webextension-polyfill'
import { ClientInfoRepository } from './client/repositories'
import { CredentialRepository } from './credentials/repositories'
import { IDownloadRecordsRepository, StorageAreaDownloadRecordsRepository } from './downloadRecords/repository'
import DownloadSettingsRepository from './settings/downloadSettings/repository'
import { FeaturesRepository } from './settings/featureSettings/repository'
import FilenameSettingsRepository, { V4FilenameSettingsRepository } from './settings/filenameSettings/repository'
import { ISettingsRepository } from './settings/repository'
import { TwitterApiSettingsRepository } from './settings/twitterApiSettings/repository'
import { IStatisticsRepositoryV4, V4StatisticsRepository } from './statistics/repositories'

interface IStorageConfiguration {
  readonly downloadRecordRepo: IDownloadRecordsRepository
  readonly statisticsRepo: IStatisticsRepositoryV4
  readonly filenameSettingsRepo: ISettingsRepository<FilenameSettings>
  readonly downloadSettingsRepo: ISettingsRepository<DownloadSettings>
  readonly featureSettingsRepo: ISettingsRepository<FeatureSettings>
}

class StorageConfiguration implements IStorageConfiguration {
  readonly downloadRecordRepo = new StorageAreaDownloadRecordsRepository(browser.storage.local)
  readonly statisticsRepo = new V4StatisticsRepository(browser.storage.local)
  readonly filenameSettingsRepo = new FilenameSettingsRepository(browser.storage.sync)
  readonly downloadSettingsRepo = new DownloadSettingsRepository(browser.storage.local)
  readonly featureSettingsRepo = new FeaturesRepository(browser.storage.local)
  readonly v4FilenameSettingsRepo = new V4FilenameSettingsRepository(browser.storage.sync)
  readonly twitterApiSettingsRepo = new TwitterApiSettingsRepository(browser.storage.local)
  readonly credentialsRepo = new CredentialRepository()
  readonly clientInfoRepo = new ClientInfoRepository(browser.storage.local, {
    credentialProvider: this.credentialsRepo.getCredential,
    statsProvider: this.statisticsRepo.getStats,
  })
}

export const storageConfig = new StorageConfiguration()
