/**
 * @jest-environment jsdom
 */
import { MockDownloadSettingsRepository } from '#mocks/repositories/downloadSettings'
import { emitStorageChange } from '#mocks/storageOnChanged'
import type { DownloadSettings } from '#schema'
import useDownloadSettings from './useDownloadSettings'
import { act, renderHook, waitFor } from '@testing-library/react'

describe('unit test for useDownloadSettings hook', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it.each<{ name: string; key: keyof DownloadSettings }>([
    { name: 'aria2', key: 'enableAria2' },
    { name: 'aggressive mode', key: 'aggressiveMode' },
    { name: 'ask where to save', key: 'askWhereToSave' },
  ])('can toggle $name', async ({ key }) => {
    const downloadSettingsRepo = new MockDownloadSettingsRepository()
    const spyGet = jest.spyOn(downloadSettingsRepo, 'get')
    const spySave = jest.spyOn(downloadSettingsRepo, 'save')
    const { result, unmount } = renderHook(() =>
      useDownloadSettings(downloadSettingsRepo)
    )
    await waitFor(() => expect(spyGet).toHaveBeenCalled())
    const original = result.current.settings[key]

    await act(async () => {
      await result.current.toggler[key]()
      emitStorageChange({ [key]: { newValue: !original, oldValue: original } })
    })

    expect(spySave).toHaveBeenCalledWith({ [key]: !original })
    await waitFor(() => expect(result.current.settings[key]).toBe(!original))

    unmount()
  })

  it.each([
    { isEnableAria2: true, canAsk: false },
    { isEnableAria2: false, canAsk: true },
  ])(
    'canAskSaveLocation should be `$canAsk` when enableAria2 is `$isEnableAria2`',
    async ({ canAsk, isEnableAria2 }) => {
      const downloadSettingsRepo = new MockDownloadSettingsRepository()
      const spyGet = jest.spyOn(downloadSettingsRepo, 'get').mockResolvedValue({
        aggressiveMode: true,
        askWhereToSave: true,
        enableAria2: isEnableAria2,
      })
      const { result, unmount } = renderHook(() =>
        useDownloadSettings(downloadSettingsRepo)
      )

      await waitFor(() => expect(spyGet).toHaveBeenCalled())
      await waitFor(() =>
        expect(result.current.canAskSaveLocation).toBe(canAsk)
      )

      unmount()
    }
  )
})
