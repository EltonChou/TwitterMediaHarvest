import type { ISettingsRepository } from '#domain/repositories/settings'
import type { FeatureSettings } from '#schema'

export class MockFeatureSettingsRepository
  implements ISettingsRepository<FeatureSettings>
{
  protected settings: FeatureSettings
  constructor() {
    this.settings = {
      autoRevealNsfw: false,
      includeVideoThumbnail: false,
      keyboardShortcut: true,
    }
  }
  async get(): Promise<FeatureSettings> {
    return this.settings
  }
  async save(settings: Partial<FeatureSettings>): Promise<void> {
    this.settings = { ...this.settings, ...settings }
  }
  async reset(): Promise<void> {
    this.settings = this.getDefault()
  }
  getDefault(): FeatureSettings {
    return {
      autoRevealNsfw: false,
      includeVideoThumbnail: false,
      keyboardShortcut: true,
    }
  }
}
