/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { ISettingsRepository } from '#domain/repositories/settings'
import type { IStorageProxy } from '#libs/storageProxy'
import type { FeatureSettings } from '#schema'

const defaultFeature: FeatureSettings = {
  autoRevealNsfw: false,
  includeVideoThumbnail: false,
  keyboardShortcut: true,
}

export class FeatureSettingsRepository
  implements ISettingsRepository<FeatureSettings>
{
  constructor(readonly storageArea: IStorageProxy<FeatureSettings>) {}

  async get(): Promise<FeatureSettings> {
    const settings = await this.storageArea.getItemByDefaults(defaultFeature)
    return settings
  }

  async save(settings: Partial<FeatureSettings>): Promise<void> {
    await this.storageArea.setItem(settings)
  }

  async reset(): Promise<void> {
    await this.save(defaultFeature)
  }

  getDefault(): FeatureSettings {
    return defaultFeature
  }
}
