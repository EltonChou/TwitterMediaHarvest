/**
 * @jest-environment jsdom
 */
import useLocaleVariables, {
  type LocaleVariableInit,
} from './useLocaleVariables'
import { renderHook } from '@testing-library/react'
import { i18n } from 'webextension-polyfill'

describe('unit test for useLocaleVariables hook', () => {
  const mockI18nGetLanguage = jest.spyOn(i18n, 'getUILanguage')

  const localVars: LocaleVariableInit<string> = {
    fallback: 'en',
    en: 'en',
    ja: 'ja',
    zh: 'zh',
  }

  it.each([
    { uiLang: 'zh-TW', expectValue: 'zh' },
    { uiLang: 'en-US', expectValue: 'en' },
    { uiLang: 'ja-JP', expectValue: 'ja' },
    { uiLang: 'fr-FR', expectValue: 'en' },
  ])(
    'can get correct variable value when ui language is $uiLang',
    ({ uiLang, expectValue }) => {
      mockI18nGetLanguage.mockReturnValue(uiLang)
      const { result } = renderHook(() => useLocaleVariables(localVars))

      const localeVar = result.current

      expect(localeVar).toBe(expectValue)
    }
  )
})
