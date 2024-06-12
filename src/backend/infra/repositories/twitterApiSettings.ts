import { ISettingsRepository } from '@backend/domain/repositories/settings'
import type { IStorageProxy } from '@libs/proxy'
import type { TwitterApiSettings } from '@schema'

const defaultSettings: TwitterApiSettings = {
  twitterApiVersion: 'gql',
}

export class TwitterApiSettingsRepository
  implements ISettingsRepository<TwitterApiSettings>
{
  constructor(readonly storageArea: IStorageProxy<TwitterApiSettings>) {}

  async get(): Promise<TwitterApiSettings> {
    const settings = await this.storageArea.getItemByDefaults(defaultSettings)

    return {
      twitterApiVersion: settings.twitterApiVersion,
    }
  }

  async save(settings: Partial<TwitterApiSettings>): Promise<void> {
    await this.storageArea.setItem(settings)
  }

  async reset(): Promise<void> {
    await this.save(defaultSettings)
  }

  getDefault(): TwitterApiSettings {
    return defaultSettings
  }
}
