import {
  BrowserStorageFetcher,
  BrowserStorageSetter,
  storageFetcher,
  storageSetter
} from '../../libs/chromeApi'


interface IDownloadSettingsRepository {
  getDownloadSettings(): Promise<DownloadSettings>
  saveDownloadSettings(settings: DownloadSettings): Promise<DownloadSettings>
}

const defaultFilenameSettings: DownloadSettings = {
  enableAria2: false,
  includeVideoThumbnail: false
}


export default class DownloadSettingsRepository implements IDownloadSettingsRepository {
  private fetchStorage: BrowserStorageFetcher
  private setStorage: BrowserStorageSetter

  constructor(storageArea: chrome.storage.StorageArea) {
    this.fetchStorage = storageFetcher(storageArea)
    this.setStorage = storageSetter(storageArea)
  }

  async getDownloadSettings(): Promise<DownloadSettings> {
    const settings = await this.fetchStorage(defaultFilenameSettings)
    return settings as DownloadSettings
  }

  async saveDownloadSettings(settings: DownloadSettings): Promise<DownloadSettings> {
    await this.setStorage(settings)
    return settings
  }
}