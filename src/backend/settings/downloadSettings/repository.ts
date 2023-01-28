import {
  BrowserStorageFetcher,
  BrowserStorageSetter,
  storageFetcher,
  storageSetter
} from '../../../libs/chromeApi'
import { ISettingsRepository } from '../repository'


const defaultFilenameSettings: DownloadSettings = {
  enableAria2: false,
  includeVideoThumbnail: false,
  aggresive_mode: false
}


export default class DownloadSettingsRepository implements ISettingsRepository<DownloadSettings> {
  private fetchStorage: BrowserStorageFetcher
  private setStorage: BrowserStorageSetter

  constructor(storageArea: chrome.storage.StorageArea) {
    this.fetchStorage = storageFetcher(storageArea)
    this.setStorage = storageSetter(storageArea)
  }

  async getSettings(): Promise<DownloadSettings> {
    const settings = await this.fetchStorage(defaultFilenameSettings)
    return settings as DownloadSettings
  }

  async saveSettings(settings: DownloadSettings): Promise<DownloadSettings> {
    await this.setStorage(settings)
    return settings
  }

  async setDefaultSettings(): Promise<void> {
    await this.setStorage(defaultFilenameSettings)
  }
}