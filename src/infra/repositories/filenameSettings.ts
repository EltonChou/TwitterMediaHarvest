import { DEFAULT_DIRECTORY } from '#constants'
import { ISettingsVORepository } from '#domain/repositories/settings'
import { FilenameSetting } from '#domain/valueObjects/filenameSetting'
import PatternToken from '#enums/patternToken'
import type { IStorageProxy } from '#libs/storageProxy'
import type { V4FilenameSettings } from '#schema'

const defaultV4FilenameSettings = new FilenameSetting({
  directory: DEFAULT_DIRECTORY,
  noSubDirectory: false,
  filenamePattern: [PatternToken.Account, PatternToken.TweetId, PatternToken.Serial],
  groupBy: '{account}',
  fileAggregation: false,
})

export class V4FilenameSettingsRepository
  implements ISettingsVORepository<FilenameSetting>
{
  constructor(readonly storage: IStorageProxy<V4FilenameSettings>) {}

  async get(): Promise<FilenameSetting> {
    const settings = await this.storage.getItemByDefaults(
      defaultV4FilenameSettings.mapBy(props => props)
    )

    return new FilenameSetting(settings)
  }

  async save(settings: FilenameSetting): Promise<void> {
    await this.storage.setItem(settings.mapBy(props => props))
  }

  async reset(): Promise<void> {
    await this.save(defaultV4FilenameSettings)
  }

  getDefault(): FilenameSetting {
    return defaultV4FilenameSettings
  }
}
