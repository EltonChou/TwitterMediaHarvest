/**
 * @jest-environment jsdom
 */
import useDrinkIcon from './useDrinkIcon'
import { renderHook } from '@testing-library/react'
import { BiCoffee, BiCoffeeTogo, BiWine } from 'react-icons/bi'
import { FaMugHot } from 'react-icons/fa'
import { LuCupSoda } from 'react-icons/lu'
import { RiBeerFill } from 'react-icons/ri'
import { TbBottle, TbBubbleTea, TbGlassFull } from 'react-icons/tb'
import { i18n } from 'webextension-polyfill'

describe('useDrinkIcon', () => {
  const mockI18nGetLanguage = jest.spyOn(i18n, 'getUILanguage')

  it.each([
    { uiLang: 'en-US', icon: BiCoffeeTogo },
    { uiLang: 'de', icon: RiBeerFill },
    { uiLang: 'es', icon: RiBeerFill },
    { uiLang: 'fr', icon: BiWine },
    { uiLang: 'it', icon: BiCoffee },
    { uiLang: 'pt-BR', icon: BiCoffee },
    { uiLang: 'ja', icon: BiCoffeeTogo },
    { uiLang: 'ko', icon: TbBottle },
    { uiLang: 'pl', icon: TbGlassFull },
    { uiLang: 'ru', icon: FaMugHot },
    { uiLang: 'tr', icon: FaMugHot },
    { uiLang: 'th', icon: LuCupSoda },
    { uiLang: 'ar', icon: BiCoffee },
    { uiLang: 'zh-CN', icon: TbBubbleTea },
    { uiLang: 'zh-TW', icon: TbBubbleTea },
    { uiLang: 'nl', icon: BiCoffeeTogo },
  ])('uses $icon.name for $uiLang', ({ uiLang, icon }) => {
    mockI18nGetLanguage.mockReturnValue(uiLang)
    const { result } = renderHook(() => useDrinkIcon())
    expect(result.current).toBe(icon)
  })
})
