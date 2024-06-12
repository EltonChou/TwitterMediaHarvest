export interface ISettingsRepository<Settings> {
  get(): Promise<Settings>
  save(settings: Partial<Settings>): Promise<void>
  reset(): Promise<void>
  getDefault(): Settings
}
