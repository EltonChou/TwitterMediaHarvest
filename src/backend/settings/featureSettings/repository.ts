import type { Storage } from 'webextension-polyfill'
import { ISettingsRepository } from '../repository'

const defaultFeature: FeatureSettings = {
  autoRevealNsfw: false,
}

export class FeaturesRepository implements ISettingsRepository<FeatureSettings> {
  constructor(readonly storageArea: Storage.StorageArea) {}

  async getSettings(): Promise<FeatureSettings> {
    const settings = (await this.storageArea.get(defaultFeature)) as FeatureSettings
    return settings
  }

  async saveSettings(settings: FeatureSettings): Promise<void> {
    await this.storageArea.set(settings)
  }

  async setDefaultSettings(): Promise<void> {
    await this.storageArea.set(defaultFeature)
  }
}
