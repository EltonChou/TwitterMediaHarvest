/**
 * @jest-environment jsdom
 */
import { MockFeatureSettingsRepository } from '#mocks/repositories/fetureSettings'
import { emitStorageChange } from '#mocks/storageOnChanged'
import type { FeatureSettings } from '#schema'
import useFeatureSettings from './useFeatureSettings'
import { act, renderHook, waitFor } from '@testing-library/react'

describe('unit test for useFeatureSettings hook', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it.each<{
    name: 'nsfw' | 'thumbnail' | 'keyboardShortcut'
    key: keyof FeatureSettings
  }>([
    { name: 'nsfw', key: 'autoRevealNsfw' },
    { name: 'thumbnail', key: 'includeVideoThumbnail' },
    { name: 'keyboardShortcut', key: 'keyboardShortcut' },
  ])('can toggle $name', async ({ name, key }) => {
    const featureSettingsRepo = new MockFeatureSettingsRepository()
    const spyGet = jest.spyOn(featureSettingsRepo, 'get')
    const spySave = jest.spyOn(featureSettingsRepo, 'save')
    const { result, unmount } = renderHook(() =>
      useFeatureSettings(featureSettingsRepo)
    )
    await waitFor(() => expect(spyGet).toHaveBeenCalled())
    const original = result.current[0][key]

    await act(async () => {
      await result.current[1][name]()
      emitStorageChange({ [key]: { newValue: !original, oldValue: original } })
    })

    expect(spySave).toHaveBeenCalledWith({ [key]: !original })
    await waitFor(() => expect(result.current[0][key]).toBe(!original))

    unmount()
  })
})
