/**
 * @jest-environment jsdom
 */
import { MockFeatureSettingsRepository } from '#mocks/repositories/fetureSettings'
import { emitStorageChange } from '#mocks/storageOnChanged'
import useSettingsStore from './useSettingsStore'
import { act, renderHook, waitFor } from '@testing-library/react'

describe('unit test for useSettingsStore hook', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should provide default settings before loading', () => {
    const repo = new MockFeatureSettingsRepository()
    jest.spyOn(repo, 'get').mockReturnValue(new Promise(() => undefined))

    const { result, unmount } = renderHook(() => useSettingsStore(repo))

    expect(result.current).toStrictEqual(repo.getDefault())
    unmount()
  })

  it('should provide loaded settings', async () => {
    const repo = new MockFeatureSettingsRepository()
    const loaded = {
      ...repo.getDefault(),
      autoRevealNsfw: true,
    }
    jest.spyOn(repo, 'get').mockResolvedValue(loaded)

    const { result, unmount } = renderHook(() => useSettingsStore(repo))

    await waitFor(() => expect(result.current).toStrictEqual(loaded))
    unmount()
  })

  it('should keep every user in sync when storage changes', async () => {
    const repo = new MockFeatureSettingsRepository()
    const spyGet = jest.spyOn(repo, 'get')
    const a = renderHook(() => useSettingsStore(repo))
    const b = renderHook(() => useSettingsStore(repo))
    await waitFor(() => expect(spyGet).toHaveBeenCalledTimes(2))

    await act(async () => {
      await repo.save({ autoRevealNsfw: true })
      emitStorageChange({
        autoRevealNsfw: { newValue: true, oldValue: false },
      })
    })

    await waitFor(() => {
      expect(a.result.current.autoRevealNsfw).toBeTrue()
      expect(b.result.current.autoRevealNsfw).toBeTrue()
    })

    a.unmount()
    b.unmount()
  })
})
