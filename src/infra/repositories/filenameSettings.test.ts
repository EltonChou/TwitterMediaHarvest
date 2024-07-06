import { InMemoryStorageProxy } from '#libs/proxy'
import { V4FilenameSettingsRepository } from './filenameSettings'

describe('unit test for v4 filename settings repository', () => {
  it('can get settings', async () => {
    const repo = new V4FilenameSettingsRepository(new InMemoryStorageProxy())
    const settings = await repo.get()

    expect(settings).toBeDefined()
  })

  it('can get default settings', () => {
    const repo = new V4FilenameSettingsRepository(new InMemoryStorageProxy())
    const settings = repo.getDefault()

    expect(settings).toBeDefined()
  })

  it('can save settings', async () => {
    const repo = new V4FilenameSettingsRepository(new InMemoryStorageProxy())
    const settings = repo.getDefault()
    const newDir = 'kappa'

    await repo.save({ ...settings, directory: newDir })
    const fetchedSettings = await repo.get()

    expect(fetchedSettings.directory).toBe(newDir)
  })

  it('can reset settings to default', async () => {
    const repo = new V4FilenameSettingsRepository(new InMemoryStorageProxy())
    const defaultSettings = repo.getDefault()

    await repo.save({ ...defaultSettings, directory: 'kappa' })
    await repo.reset()
    const fetchedSettings = await repo.get()

    expect(fetchedSettings).toStrictEqual(defaultSettings)
  })
})
