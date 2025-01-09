import { FilenameSetting } from '#domain/valueObjects/filenameSetting'
import { InMemoryStorageProxy } from '#mocks/storageProxy'
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

    await repo.save(
      new FilenameSetting({
        ...settings.mapBy(props => props),
        directory: newDir,
      })
    )
    const fetchedSettings = await repo.get()

    expect(fetchedSettings.mapBy(props => props.directory)).toBe(newDir)
  })

  it('can reset settings to default', async () => {
    const repo = new V4FilenameSettingsRepository(new InMemoryStorageProxy())
    const defaultSettings = repo.getDefault()

    await repo.save(
      new FilenameSetting({
        ...defaultSettings.mapBy(props => props),
        directory: 'kappa',
      })
    )
    await repo.reset()
    const fetchedSettings = await repo.get()

    expect(fetchedSettings.is(defaultSettings)).toBeTruthy()
  })
})
