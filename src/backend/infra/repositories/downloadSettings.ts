import type { ISettingsRepository } from '@backend/domain/repositories/settings'
import type { IStorageProxy } from '@libs/proxy'
import type { DownloadSettings } from '@schema'

const defaultIntegrationSettings: DownloadSettings = {
  enableAria2: false,
  aggressiveMode: false,
  askWhereToSave: false,
}

export class DownloadSettingsRepository implements ISettingsRepository<DownloadSettings> {
  constructor(readonly storageArea: IStorageProxy<DownloadSettings>) {}

  async get(): Promise<DownloadSettings> {
    const settings = await this.storageArea.getItemByDefaults(defaultIntegrationSettings)
    return settings as DownloadSettings
  }

  async save(settings: Partial<DownloadSettings>): Promise<void> {
    await this.storageArea.setItem(settings)
  }

  async reset(): Promise<void> {
    await this.save(defaultIntegrationSettings)
  }

  getDefault(): DownloadSettings {
    return defaultIntegrationSettings
  }
}
