export interface ISettingsRepository<S> {
  getSettings(): Promise<S>
  saveSettings(settings: S): Promise<S>
  setDefaultSettings(): Promise<void>
}
