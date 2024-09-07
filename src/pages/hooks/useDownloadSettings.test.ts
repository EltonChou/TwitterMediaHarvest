/**
 * @jest-environment jsdom
 */
import { MockDownloadSettingsRepository } from '#mocks/repositories/downloadSettings'
import useDownloadSettings from './useDownloadSettings'
import { renderHook, waitFor } from '@testing-library/react'

describe('unit test for useFeatureSettings hook', () => {
  const downloadSettingsRepo = new MockDownloadSettingsRepository()

  // Suppressing unnecessary warnings on React DOM 16.8
  beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation((...args) => {
      if (/Warning.*not wrapped in act/.test(args[0])) {
        return
      }
      console.error(console, ...args)
    })
  })

  afterAll(() => {
    jest.resetAllMocks()
    jest.restoreAllMocks()
  })

  it('can toggle feature settings', async () => {
    const { result } = renderHook(() => useDownloadSettings(downloadSettingsRepo))
    const [originalSettings, toggler] = result.current

    await waitFor(() => {
      const [settings] = result.current
      expect(settings).toStrictEqual(downloadSettingsRepo.getDefault())
    })

    await toggler.aggressiveMode()
    await waitFor(() => {
      const [settings] = result.current
      expect(settings.aggressiveMode).toBe(!originalSettings.aggressiveMode)
    })

    await toggler.askWhereToSave()
    await waitFor(() => {
      const [settings] = result.current
      expect(settings.askWhereToSave).toBe(!originalSettings.askWhereToSave)
    })

    await toggler.enableAria2()
    await waitFor(() => {
      const [settings] = result.current
      expect(settings.enableAria2).toBe(!originalSettings.enableAria2)
    })
  })
})
