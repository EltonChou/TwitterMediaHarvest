import {
  BrowserStorageFetcher,
  BrowserStorageSetter,
  storageFetcher,
  storageSetter
} from '../../libs/chromeApi'
import {
  DEFAULT_DIRECTORY,
} from '../../constants'


interface IFilenameSettingsRepository {
  getFilenameSettings(): Promise<FilenameSettings>
  saveFilenameSettings(settings: FilenameSettings): Promise<FilenameSettings>
}

const defaultFilenameSettings: FilenameSettings = {
  directory: DEFAULT_DIRECTORY,
  no_subdirectory: false,
  filename_pattern: {
    account: true,
    serial: 'order'
  }
}


export default class FilenameSettingsRepository implements IFilenameSettingsRepository {
  private fetchStorage: BrowserStorageFetcher
  private setStorage: BrowserStorageSetter

  constructor(storageArea: chrome.storage.StorageArea) {
    this.fetchStorage = storageFetcher(storageArea)
    this.setStorage = storageSetter(storageArea)
  }

  async getFilenameSettings(): Promise<FilenameSettings> {
    const settings = await this.fetchStorage(defaultFilenameSettings)
    return settings as FilenameSettings
  }

  async saveFilenameSettings(settings: FilenameSettings): Promise<FilenameSettings> {
    await this.setStorage(settings)
    return settings
  }
}