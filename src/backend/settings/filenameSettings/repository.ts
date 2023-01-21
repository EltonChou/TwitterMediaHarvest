import {
  BrowserStorageFetcher,
  BrowserStorageSetter,
  storageFetcher,
  storageSetter
} from '../../../libs/chromeApi'
import {
  DEFAULT_DIRECTORY,
} from '../../../constants'
import { ISettingsRepository } from '../repository'


const defaultFilenameSettings: FilenameSettings = {
  directory: DEFAULT_DIRECTORY,
  no_subdirectory: false,
  filename_pattern: {
    account: true,
    serial: 'order'
  }
}


export default class FilenameSettingsRepository implements ISettingsRepository<FilenameSettings> {
  private fetchStorage: BrowserStorageFetcher
  private setStorage: BrowserStorageSetter

  constructor(storageArea: chrome.storage.StorageArea) {
    this.fetchStorage = storageFetcher(storageArea)
    this.setStorage = storageSetter(storageArea)
  }

  async getSettings(): Promise<FilenameSettings> {
    const settings = await this.fetchStorage(defaultFilenameSettings)
    return settings as FilenameSettings
  }

  async saveSettings(settings: FilenameSettings): Promise<FilenameSettings> {
    await this.setStorage(settings)
    return settings
  }
}