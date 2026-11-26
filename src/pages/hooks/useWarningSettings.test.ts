/**
 * @jest-environment jsdom
 */
import { MockWarningSettingsRepo } from '#mocks/repositories/warningSettings'
import { emitStorageChange } from '#mocks/storageOnChanged'
import useWarningSettings from './useWarningSettings'
import { act, renderHook, waitFor } from '@testing-library/react'

describe('unit test for useWarningSettings hook', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('can toggle filename overwritten warning', async () => {
    const warningSettingsRepo = new MockWarningSettingsRepo()
    const spyGet = jest.spyOn(warningSettingsRepo, 'get')
    const spySave = jest.spyOn(warningSettingsRepo, 'save')
    const { result, unmount } = renderHook(() =>
      useWarningSettings(warningSettingsRepo)
    )
    await waitFor(() => expect(spyGet).toHaveBeenCalled())
    const original = result.current.settings.ignoreFilenameOverwritten

    await act(async () => {
      await result.current.toggler.ignoreFilenameOverwritten()
      emitStorageChange({
        ignoreFilenameOverwritten: { newValue: !original, oldValue: original },
      })
    })

    expect(spySave).toHaveBeenCalledWith({
      ignoreFilenameOverwritten: !original,
    })
    await waitFor(() =>
      expect(result.current.settings.ignoreFilenameOverwritten).toBe(!original)
    )

    unmount()
  })

  it('should not let a late initial load overwrite a toggle', async () => {
    const warningSettingsRepo = new MockWarningSettingsRepo()
    let resolveInitial: (v: {
      ignoreFilenameOverwritten: boolean
    }) => void = () => undefined
    jest
      .spyOn(warningSettingsRepo, 'get')
      .mockReturnValueOnce(new Promise(resolve => (resolveInitial = resolve)))
    const { result, unmount } = renderHook(() =>
      useWarningSettings(warningSettingsRepo)
    )

    await act(async () => {
      await result.current.toggler.ignoreFilenameOverwritten()
      emitStorageChange({
        ignoreFilenameOverwritten: { newValue: true, oldValue: false },
      })
    })
    await waitFor(() =>
      expect(result.current.settings.ignoreFilenameOverwritten).toBeTrue()
    )

    await act(async () => resolveInitial({ ignoreFilenameOverwritten: false }))

    expect(result.current.settings.ignoreFilenameOverwritten).toBeTrue()
    unmount()
  })
})
