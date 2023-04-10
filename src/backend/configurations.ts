import browser from 'webextension-polyfill'
import { IDownloadRecordsRepository, StorageAreaDownloadRecordsRepository } from './downloadRecords/repository'
import DownloadSettingsRepository from './settings/downloadSettings/repository'
import FilenameSettingsRepository, { V4FilenameSettingsRepository } from './settings/filenameSettings/repository'
import { ISettingsRepository } from './settings/repository'
import StatisticsRepository, { IStatisticsRepository } from './statistics/repositories'
import { FeaturesRepository } from './settings/featureSettings/repository'

interface IStorageConfiguration {
  readonly downloadRecordRepo: IDownloadRecordsRepository
  readonly statisticsRepo: IStatisticsRepository
  readonly filenameSettingsRepo: ISettingsRepository<FilenameSettings>
  readonly downloadSettingsRepo: ISettingsRepository<DownloadSettings>
  readonly featureSettingsRepo: ISettingsRepository<FeatureSettings>
}

class StorageConfiguration implements IStorageConfiguration {
  readonly downloadRecordRepo = new StorageAreaDownloadRecordsRepository(browser.storage.local)
  readonly statisticsRepo = new StatisticsRepository(browser.storage.local)
  readonly filenameSettingsRepo = new FilenameSettingsRepository(browser.storage.sync)
  readonly downloadSettingsRepo = new DownloadSettingsRepository(browser.storage.local)
  readonly featureSettingsRepo = new FeaturesRepository(browser.storage.local)
  readonly v4FilenameSettingsRepo = new V4FilenameSettingsRepository(browser.storage.sync)
}

export const storageConfig = new StorageConfiguration()
