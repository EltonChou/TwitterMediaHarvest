/**
 * @jest-environment jsdom
 */
import { MockDownloadSettingsRepository } from '#mocks/repositories/downloadSettings'
import useDownloadSettings from './useDownloadSettings'
import { renderHook } from '@testing-library/react'
import { act } from 'react'

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

    expect(originalSettings).toStrictEqual(downloadSettingsRepo.getDefault())

    await act(async () => {
      await toggler.aggressiveMode()
      await toggler.askWhereToSave()
      await toggler.enableAria2()
    })

    const [settings] = result.current
    expect(settings.aggressiveMode).toBe(!originalSettings.aggressiveMode)
    expect(settings.askWhereToSave).toBe(!originalSettings.askWhereToSave)
    expect(settings.enableAria2).toBe(!originalSettings.enableAria2)
  })
})
