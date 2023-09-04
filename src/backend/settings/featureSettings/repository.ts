import { ISettingsRepository } from '../repository'
import type { IStorageProxy } from '@libs/proxy'
import type { FeatureSettings } from '@schema'

const defaultFeature: FeatureSettings = {
  autoRevealNsfw: false,
  includeVideoThumbnail: false,
  keyboardShortcut: true,
}

export class FeaturesRepository implements ISettingsRepository<FeatureSettings> {
  constructor(readonly storageArea: IStorageProxy<FeatureSettings>) {}

  async getSettings(): Promise<FeatureSettings> {
    const settings = await this.storageArea.getItemByDefaults(defaultFeature)
    return settings
  }

  async saveSettings(settings: Partial<FeatureSettings>): Promise<void> {
    await this.storageArea.setItem(settings)
  }

  async setDefaultSettings(): Promise<void> {
    await this.saveSettings(defaultFeature)
  }

  getDefaultSettings(): FeatureSettings {
    return defaultFeature
  }
}
