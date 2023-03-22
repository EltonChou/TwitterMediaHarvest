import { IDownloadRecordsRepository, StorageAreaDownloadRecordsRepository } from './downloadRecords/repository'
import StatisticsRepository, { IStatisticsRepository } from './statistics/repositories'
import { ISettingsRepository } from './settings/repository'
import DownloadSettingsRepository from './settings/downloadSettings/repository'
import FilenameSettingsRepository from './settings/filenameSettings/repository'


interface IStorageConfiguration {
    downloadRecordRepo: IDownloadRecordsRepository
    statisticsRepo: IStatisticsRepository
    filenameSettingsRepo: ISettingsRepository<FilenameSettings>
    downloadSettingsRepo: ISettingsRepository<DownloadSettings>
}


class StorageConfiguration implements IStorageConfiguration {
  public downloadRecordRepo = new StorageAreaDownloadRecordsRepository(chrome.storage.local)
  public statisticsRepo = new StatisticsRepository(chrome.storage.local)
  public filenameSettingsRepo = new FilenameSettingsRepository(chrome.storage.sync)
  public downloadSettingsRepo = new DownloadSettingsRepository(chrome.storage.local)
}


export const storageConfig = new StorageConfiguration
