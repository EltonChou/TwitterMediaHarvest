/**
 * @jest-environment jsdom
 */
import { MockFeatureSettingsRepository } from '#mocks/repositories/fetureSettings'
import useFeatureSettings from './useFeatureSettings'
import { renderHook } from '@testing-library/react'
import { act } from 'react'

describe('unit test for useFeatureSettings hook', () => {
  const featureSettingsRepo = new MockFeatureSettingsRepository()

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
    expect(settings.includeVideoThumbnail).toBe(!originalSettings.includeVideoThumbnail)
  })
})
