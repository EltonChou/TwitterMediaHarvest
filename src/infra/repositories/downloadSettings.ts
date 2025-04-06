/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import type { ISettingsRepository } from '#domain/repositories/settings'
import type { IStorageProxy } from '#libs/storageProxy'
import type { DownloadSettings } from '#schema'

const defaultIntegrationSettings: DownloadSettings = {
  enableAria2: false,
  aggressiveMode: false,
  askWhereToSave: false,
}

export class DownloadSettingsRepository
  implements ISettingsRepository<DownloadSettings>
{
  constructor(readonly storageArea: IStorageProxy<DownloadSettings>) {}

  async get(): Promise<DownloadSettings> {
    const settings = await this.storageArea.getItemByDefaults(
      defaultIntegrationSettings
    )
    return settings
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
