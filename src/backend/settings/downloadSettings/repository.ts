import { ISettingsRepository } from '../repository'
import type { Storage } from 'webextension-polyfill'

const defaultFilenameSettings: DownloadSettings = {
  enableAria2: false,
  includeVideoThumbnail: false,
  aggressive_mode: false,
}

export default class DownloadSettingsRepository implements ISettingsRepository<DownloadSettings> {
  readonly storageArea: Storage.StorageArea

  constructor(storageArea: Storage.StorageArea) {
    this.storageArea = storageArea
  }

  async getSettings(): Promise<DownloadSettings> {
    const settings = await this.storageArea.get(defaultFilenameSettings)
    return settings as DownloadSettings
  }

  async saveSettings(settings: DownloadSettings): Promise<DownloadSettings> {
    await this.storageArea.set(settings)
    return settings
  }

  async setDefaultSettings(): Promise<void> {
    await this.storageArea.set(defaultFilenameSettings)
  }
}
