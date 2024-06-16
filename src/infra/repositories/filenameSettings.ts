import { DEFAULT_DIRECTORY } from '#constants'
import { ISettingsRepository } from '#domain/repositories/settings'
import PatternToken from '#enums/patternToken'
import type { IStorageProxy } from '#libs/proxy'
import type { V4FilenameSettings } from '#schema'

const defaultV4FilenameSettings: V4FilenameSettings = {
  directory: DEFAULT_DIRECTORY,
  noSubDirectory: false,
  filenamePattern: [PatternToken.Account, PatternToken.TweetId, PatternToken.Serial],
  groupBy: '{account}',
  fileAggregation: false,
}

export class V4FilenameSettingsRepository
  implements ISettingsRepository<V4FilenameSettings>
{
  constructor(readonly storage: IStorageProxy<V4FilenameSettings>) {}

  async get(): Promise<V4FilenameSettings> {
    const settings = await this.storage.getItemByDefaults(defaultV4FilenameSettings)

    return settings
  }

  async save(settings: Partial<V4FilenameSettings>): Promise<void> {
    await this.storage.setItem(settings)
  }

  async reset(): Promise<void> {
    await this.save(defaultV4FilenameSettings)
  }

  getDefault(): V4FilenameSettings {
    return defaultV4FilenameSettings
  }
}
