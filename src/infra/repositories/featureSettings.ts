import { ISettingsRepository } from '#domain/repositories/settings'
import type { IStorageProxy } from '#libs/storageProxy'
import type { FeatureSettings } from '#schema'

const defaultFeature: FeatureSettings = {
  autoRevealNsfw: false,
  includeVideoThumbnail: false,
  keyboardShortcut: true,
}

export class FeatureSettingsRepository
  implements ISettingsRepository<FeatureSettings>
{
  constructor(readonly storageArea: IStorageProxy<FeatureSettings>) {}

  async get(): Promise<FeatureSettings> {
    const settings = await this.storageArea.getItemByDefaults(defaultFeature)
    return settings
  }

  async save(settings: Partial<FeatureSettings>): Promise<void> {
    await this.storageArea.setItem(settings)
  }

  async reset(): Promise<void> {
    await this.save(defaultFeature)
  }

  getDefault(): FeatureSettings {
    return defaultFeature
  }
}
