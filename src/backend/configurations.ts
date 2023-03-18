import browser from 'webextension-polyfill'
import { IDownloadRecordsRepository, StorageAreaDownloadRecordsRepository } from './downloadRecords/repository'
import DownloadSettingsRepository from './settings/downloadSettings/repository'
import FilenameSettingsRepository from './settings/filenameSettings/repository'
import { ISettingsRepository } from './settings/repository'
import StatisticsRepository, { IStatisticsRepository } from './statistics/repositories'

interface IStorageConfiguration {
  downloadRecordRepo: IDownloadRecordsRepository
  statisticsRepo: IStatisticsRepository
  filenameSettingsRepo: ISettingsRepository<FilenameSettings>
  downloadSettingsRepo: ISettingsRepository<DownloadSettings>
}

class StorageConfiguration implements IStorageConfiguration {
  public downloadRecordRepo = new StorageAreaDownloadRecordsRepository(browser.storage.local)
  public statisticsRepo = new StatisticsRepository(browser.storage.local)
  public filenameSettingsRepo = new FilenameSettingsRepository(browser.storage.sync)
  public downloadSettingsRepo = new DownloadSettingsRepository(browser.storage.local)
}

export const storageConfig = new StorageConfiguration()
