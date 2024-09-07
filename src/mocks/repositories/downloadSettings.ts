import type { ISettingsRepository } from '#domain/repositories/settings'
import type { DownloadSettings } from '#schema'

export class MockDownloadSettingsRepository
  implements ISettingsRepository<DownloadSettings>
{
  protected settings: DownloadSettings
  constructor() {
    this.settings = {
      aggressiveMode: false,
      askWhereToSave: false,
      enableAria2: false,
    }
  }
  async get(): Promise<DownloadSettings> {
    return this.settings
  }
  async save(settings: Partial<DownloadSettings>): Promise<void> {
    this.settings = { ...this.settings, ...settings }
    return
  }
  async reset(): Promise<void> {
    this.settings = this.getDefault()
  }
  getDefault(): DownloadSettings {
    return {
      aggressiveMode: false,
      askWhereToSave: false,
      enableAria2: false,
    }
  }
}
