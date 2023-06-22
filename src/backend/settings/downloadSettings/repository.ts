import type { DownloadSettings } from '@schema'
import type { Storage } from 'webextension-polyfill'
import { ISettingsRepository } from '../repository'

const defaultIntegrationSettings: DownloadSettings = {
  enableAria2: false,
  aggressiveMode: false,
  askWhereToSave: false,
}

export default class DownloadSettingsRepository implements ISettingsRepository<DownloadSettings> {
  constructor(readonly storageArea: Storage.StorageArea) {}

  async getSettings(): Promise<DownloadSettings> {
    const settings = await this.storageArea.get(defaultIntegrationSettings)
    return settings as DownloadSettings
  }

  async saveSettings(settings: Partial<DownloadSettings>): Promise<void> {
    await this.storageArea.set(settings)
  }

  async setDefaultSettings(): Promise<void> {
    await this.storageArea.set(defaultIntegrationSettings)
  }

  getDefaultSettings(): DownloadSettings {
    return defaultIntegrationSettings
  }
}
