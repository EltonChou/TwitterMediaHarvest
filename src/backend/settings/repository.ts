export interface ISettingsRepository<S> {
  getSettings(): Promise<S>
  saveSettings(settings: S): Promise<void>
  setDefaultSettings(): Promise<void>
}
