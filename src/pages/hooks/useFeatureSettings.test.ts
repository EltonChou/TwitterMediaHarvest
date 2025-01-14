/**
 * @jest-environment jsdom
 */
import { MockFeatureSettingsRepository } from '#mocks/repositories/fetureSettings'
import useFeatureSettings from './useFeatureSettings'
import { renderHook } from '@testing-library/react'
import { act } from 'react'

describe('unit test for useFeatureSettings hook', () => {
  const featureSettingsRepo = new MockFeatureSettingsRepository()

  afterAll(() => {
    jest.resetAllMocks()
    jest.restoreAllMocks()
  })

  it('can toggle feature settings', async () => {
    const { result } = renderHook(() => useFeatureSettings(featureSettingsRepo))
    const [originalSettings, toggler] = result.current

    expect(originalSettings).toStrictEqual(featureSettingsRepo.getDefault())

    await act(async () => {
      await toggler.nsfw()
      await toggler.keyboardShortcut()
      await toggler.thumbnail()
    })

    const [settings] = result.current
    expect(settings.autoRevealNsfw).toBe(!originalSettings.autoRevealNsfw)
    expect(settings.keyboardShortcut).toBe(!originalSettings.keyboardShortcut)
    expect(settings.includeVideoThumbnail).toBe(
      !originalSettings.includeVideoThumbnail
    )
  })
})
