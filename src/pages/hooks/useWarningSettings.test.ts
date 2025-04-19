/**
 * @jest-environment jsdom
 */
import { MockWarningSettingsRepo } from '#mocks/repositories/warningSettings'
import useWarningSettings from './useWarningSettings'
import { act, renderHook, waitFor } from '@testing-library/react'

describe('unit test for useWarningSettings hook', () => {
  const warningSettingsRepo = new MockWarningSettingsRepo()

  afterAll(() => {
    jest.resetAllMocks()
    jest.restoreAllMocks()
  })

  it('can toggle warning settings', async () => {
    const { result, unmount } = renderHook(() =>
      useWarningSettings(warningSettingsRepo)
    )
    const { settings: originalSettings, toggler } = result.current

    waitFor(() =>
      expect(originalSettings).toStrictEqual(warningSettingsRepo.getDefault())
    )

    await act(async () => {
      await toggler.ignoreFilenameOverwritten()
    })

    const { settings } = result.current
    expect(settings.ignoreFilenameOverwritten).toBe(
      !originalSettings.ignoreFilenameOverwritten
    )

    unmount()
  })
})
