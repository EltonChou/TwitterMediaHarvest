import type { Storage } from 'webextension-polyfill'
import { ISettingsRepository } from '../repository'

const defaultSettings: TwitterApiSettings = {
  version: 'v2',
}

export class TwitterApiSettingsRepository implements ISettingsRepository<TwitterApiSettings> {
  constructor(readonly storageArea: Storage.StorageArea) {}

  async getSettings(): Promise<TwitterApiSettings> {
    const settings = await this.storageArea.get(defaultSettings)

    return {
      version: settings.version,
    }
  }

  async saveSettings(settings: Partial<TwitterApiSettings>): Promise<void> {
    await this.storageArea.set(settings)
  }

  async setDefaultSettings(): Promise<void> {
    await this.storageArea.set(defaultSettings)
  }

  getDefaultSettings(): TwitterApiSettings {
    return defaultSettings
  }
}
