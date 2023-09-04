import { ISettingsRepository } from '../repository'
import type { IStorageProxy } from '@libs/proxy'
import type { TwitterApiSettings } from '@schema'

const defaultSettings: TwitterApiSettings = {
  twitterApiVersion: 'gql',
}

export class TwitterApiSettingsRepository
  implements ISettingsRepository<TwitterApiSettings>
{
  constructor(readonly storageArea: IStorageProxy<TwitterApiSettings>) {}

  async getSettings(): Promise<TwitterApiSettings> {
    const settings = await this.storageArea.getItemByDefaults(defaultSettings)

    return {
      twitterApiVersion: settings.twitterApiVersion,
    }
  }

  async saveSettings(settings: Partial<TwitterApiSettings>): Promise<void> {
    await this.storageArea.setItem(settings)
  }

  async setDefaultSettings(): Promise<void> {
    await this.saveSettings(defaultSettings)
  }

  getDefaultSettings(): TwitterApiSettings {
    return defaultSettings
  }
}
