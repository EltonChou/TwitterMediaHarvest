import { DEFAULT_DIRECTORY } from '../../../constants'
import { ISettingsRepository } from '../repository'
import { PatternToken } from '@backend/enums'
import type { IStorageProxy } from '@libs/proxy'
import type { V4FilenameSettings } from '@schema'
import type { Storage } from 'webextension-polyfill'

export type FilenameSettings = {
  directory: string
  no_subdirectory: boolean
  filename_pattern: {
    account: boolean
    serial: 'order' | 'filename'
  }
}

const defaultFilenameSettings: FilenameSettings = {
  directory: DEFAULT_DIRECTORY,
  no_subdirectory: false,
  filename_pattern: {
    account: true,
    serial: 'order',
  },
}

const defaultV4FilenameSettings: V4FilenameSettings = {
  separator: '-',
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

  async getSettings(): Promise<V4FilenameSettings> {
    const settings = await this.storage.getItemByDefaults(defaultV4FilenameSettings)

    return settings
  }

  async saveSettings(settings: Partial<V4FilenameSettings>): Promise<void> {
    await this.storage.setItem(settings)
  }

  async setDefaultSettings(): Promise<void> {
    await this.saveSettings(defaultV4FilenameSettings)
  }

  getDefaultSettings(): V4FilenameSettings {
    return defaultV4FilenameSettings
  }
}

export default class FilenameSettingsRepository
  implements ISettingsRepository<FilenameSettings>
{
  constructor(readonly storage: Storage.StorageArea) {}

  async getSettings(): Promise<FilenameSettings> {
    const settings = await this.storage.get(defaultFilenameSettings)
    return settings as FilenameSettings
  }

  async saveSettings(settings: Partial<FilenameSettings>): Promise<void> {
    await this.storage.set(settings)
  }

  async setDefaultSettings(): Promise<void> {
    await this.saveSettings(defaultFilenameSettings)
  }

  getDefaultSettings(): FilenameSettings {
    return defaultFilenameSettings
  }
}
