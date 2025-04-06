/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import type { ISettingsVORepository } from '#domain/repositories/settings'
import {
  AggregationToken,
  FilenameSetting,
} from '#domain/valueObjects/filenameSetting'
import PatternToken from '#enums/patternToken'
import type { IStorageProxy } from '#libs/storageProxy'
import type { V4FilenameSettings } from '#schema'

const defaultV4FilenameSettings = new FilenameSetting({
  directory:
    process.env.NODE_ENV === 'production' ? 'twitter_media_harvest' : 'mh-dev',
  noSubDirectory: false,
  filenamePattern: [
    PatternToken.Account,
    PatternToken.TweetId,
    PatternToken.Serial,
  ],
  groupBy: AggregationToken.Account,
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
