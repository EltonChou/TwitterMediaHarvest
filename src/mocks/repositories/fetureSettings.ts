import type { ISettingsRepository } from '#domain/repositories/settings'
import type { FeatureSettings } from '#schema'

export class MockFeatureSettingsRepository
  implements ISettingsRepository<FeatureSettings>
{
  async get(): Promise<FeatureSettings> {
    throw new Error('Method not implemented.')
  }
  async save(settings: Partial<FeatureSettings>): Promise<void> {
    throw new Error('Method not implemented.')
  }
  async reset(): Promise<void> {
    throw new Error('Method not implemented.')
  }
  getDefault(): FeatureSettings {
    throw new Error('Method not implemented.')
  }
}
