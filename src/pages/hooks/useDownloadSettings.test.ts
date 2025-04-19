/**
 * @jest-environment jsdom
 */
import { MockDownloadSettingsRepository } from '#mocks/repositories/downloadSettings'
import useDownloadSettings from './useDownloadSettings'
import { act, renderHook, waitFor } from '@testing-library/react'

describe('unit test for useFeatureSettings hook', () => {
  const downloadSettingsRepo = new MockDownloadSettingsRepository()

  afterAll(() => {
    jest.resetAllMocks()
    jest.restoreAllMocks()
  })

  it('can toggle feature settings', async () => {
    const { result, unmount } = renderHook(() =>
      useDownloadSettings(downloadSettingsRepo)
    )
    const { settings: originalSettings, toggler } = result.current

    waitFor(() =>
      expect(originalSettings).toStrictEqual(downloadSettingsRepo.getDefault())
    )

    await act(async () => {
      await toggler.aggressiveMode()
      await toggler.askWhereToSave()
      await toggler.enableAria2()
    })

    const { settings } = result.current
    expect(settings.aggressiveMode).toBe(!originalSettings.aggressiveMode)
    expect(settings.askWhereToSave).toBe(!originalSettings.askWhereToSave)
    expect(settings.enableAria2).toBe(!originalSettings.enableAria2)

    unmount()
  })

  it.each([
    { buildTarget: 'chrome', isEnableAria2: true, canAsk: false },
    { buildTarget: 'chrome', isEnableAria2: false, canAsk: false },
    { buildTarget: 'firefox', isEnableAria2: true, canAsk: false },
    { buildTarget: 'firefox', isEnableAria2: false, canAsk: true },
    { buildTarget: 'edge', isEnableAria2: true, canAsk: false },
    { buildTarget: 'edge', isEnableAria2: false, canAsk: false },
  ])(
    'canAskSaveLocation should be `$canAsk` when build target is $buildTarget and enableAria2 is `$isEnableAria2`',
    ({ buildTarget, canAsk, isEnableAria2 }) => {
      Object.assign(global, { __BROWSER__: buildTarget })
      jest.spyOn(downloadSettingsRepo, 'get').mockResolvedValue({
        aggressiveMode: true,
        askWhereToSave: true,
        enableAria2: isEnableAria2,
      })
      const { result, unmount } = renderHook(() =>
        useDownloadSettings(downloadSettingsRepo)
      )
      const { canAskSaveLocation } = result.current

      waitFor(() => expect(canAskSaveLocation).toBe(canAsk))

      unmount()
    }
  )
})
