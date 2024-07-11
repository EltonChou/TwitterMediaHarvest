export interface ISettingsRepository<Settings> {
  get(): Promise<Settings>
  save(settings: Partial<Settings>): Promise<void>
  reset(): Promise<void>
  getDefault(): Settings
}

export interface ISettingsVORepository<Settings> {
  get(): Promise<Settings>
  save(settings: Settings): Promise<void>
  reset(): Promise<void>
  getDefault(): Settings
}
