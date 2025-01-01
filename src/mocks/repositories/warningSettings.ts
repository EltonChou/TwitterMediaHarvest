import type { IWarningSettingsRepo } from '#domain/repositories/warningSettings'
import { WarningSettings } from '#schema'

export class MockWarningSettingsRepo implements IWarningSettingsRepo {
  get(): Promise<WarningSettings> {
    throw new Error('Method not implemented.')
  }
  save(settings: Partial<WarningSettings>): Promise<void> {
    throw new Error('Method not implemented.')
  }
  reset(): Promise<void> {
    throw new Error('Method not implemented.')
  }
  getDefault(): WarningSettings {
    throw new Error('Method not implemented.')
  }
}
