import type { ISettingsRepository } from '#domain/repositories/settings'
import type { DownloadSettings } from '#schema'

export class MockDownloadSettingsRepository
  implements ISettingsRepository<DownloadSettings>
{
  async get(): Promise<DownloadSettings> {
    return {
      aggressiveMode: false,
      askWhereToSave: false,
      enableAria2: false,
    }
  }
  save(settings: Partial<DownloadSettings>): Promise<void> {
    throw new Error('Method not implemented.')
  }
  reset(): Promise<void> {
    throw new Error('Method not implemented.')
  }
  getDefault(): DownloadSettings {
    throw new Error('Method not implemented.')
  }
}
