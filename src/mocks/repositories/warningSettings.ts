import type { IWarningSettingsRepo } from '#domain/repositories/warningSettings'
import { WarningSettings } from '#schema'

export class MockWarningSettingsRepo implements IWarningSettingsRepo {
  protected settings: WarningSettings

  constructor() {
    this.settings = {
      ignoreFilenameOverwritten: false,
    }
  }

  async get(): Promise<WarningSettings> {
    return this.settings
  }

  async save(settings: Partial<WarningSettings>): Promise<void> {
    this.settings = { ...this.settings, ...settings }
  }

  async reset(): Promise<void> {
    this.settings = this.getDefault()
  }

  getDefault(): WarningSettings {
    return { ignoreFilenameOverwritten: false }
  }
}
