/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import type { IWarningSettingsRepo } from '#domain/repositories/warningSettings'
import type { IStorageProxy } from '#libs/storageProxy'
import type { WarningSettings } from '#schema'

const defaultWarningSettings: WarningSettings = Object.freeze<WarningSettings>({
  ignoreFilenameOverwritten: false,
})

export class WarningSettingsRepo implements IWarningSettingsRepo {
  constructor(readonly storage: IStorageProxy<WarningSettings>) {}

  async get(): Promise<WarningSettings> {
    const settings = await this.storage.getItemByDefaults(
      defaultWarningSettings
    )
    return settings
  }

  async save(settings: Partial<WarningSettings>): Promise<void> {
    await this.storage.setItem(settings)
  }

  async reset(): Promise<void> {
    await this.storage.setItem(defaultWarningSettings)
  }

  getDefault(): WarningSettings {
    return defaultWarningSettings
  }
}
