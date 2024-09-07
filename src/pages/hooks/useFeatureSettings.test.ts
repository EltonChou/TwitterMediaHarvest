/**
 * @jest-environment jsdom
 */
import { MockFeatureSettingsRepository } from '#mocks/repositories/fetureSettings'
import useFeatureSettings from './useFeatureSettings'
import { renderHook, waitFor } from '@testing-library/react'

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

    await waitFor(() => {
      const [settings] = result.current
      expect(settings).toStrictEqual(featureSettingsRepo.getDefault())
    })

    await toggler.nsfw()
    await waitFor(() => {
      const [settings] = result.current
      expect(settings.autoRevealNsfw).toBe(!originalSettings.autoRevealNsfw)
    })

    await toggler.keyboardShortcut()
    await waitFor(() => {
      const [settings] = result.current
      expect(settings.keyboardShortcut).toBe(!originalSettings.keyboardShortcut)
    })

    await toggler.thumbnail()
    await waitFor(() => {
      const [settings] = result.current
      expect(settings.includeVideoThumbnail).toBe(!originalSettings.includeVideoThumbnail)
    })
  })
})
