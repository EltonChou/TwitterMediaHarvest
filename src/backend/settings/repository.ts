export interface ISettingsRepository<S> {
  getSettings(): Promise<S>
  saveSettings(settings: Partial<S>): Promise<void>
  setDefaultSettings(): Promise<void>
}
