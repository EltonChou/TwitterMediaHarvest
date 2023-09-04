import { ISettingsRepository } from '../repository'
import type { IStorageProxy } from '@libs/proxy'
import type { DownloadSettings } from '@schema'

const defaultIntegrationSettings: DownloadSettings = {
  enableAria2: false,
  aggressiveMode: false,
  askWhereToSave: false,
}

export default class DownloadSettingsRepository
  implements ISettingsRepository<DownloadSettings>
{
  constructor(readonly storageArea: IStorageProxy<DownloadSettings>) {}

  async getSettings(): Promise<DownloadSettings> {
    const settings = await this.storageArea.getItemByDefaults(defaultIntegrationSettings)
    return settings as DownloadSettings
  }

  async saveSettings(settings: Partial<DownloadSettings>): Promise<void> {
    await this.storageArea.setItem(settings)
  }

  async setDefaultSettings(): Promise<void> {
    await this.saveSettings(defaultIntegrationSettings)
  }

  getDefaultSettings(): DownloadSettings {
    return defaultIntegrationSettings
  }
}
