import { useState } from 'react'
import browser from 'webextension-polyfill'

type SupportLocale = 'en' | 'ja' | 'zh'

type LocalVariableInit<T> = { base: T } & Partial<Record<SupportLocale, T>>

const useLocaleVariables = <T>(initVariables: LocalVariableInit<T>, initLocale?: string) => {
  const [locale] = useState(initLocale || browser.i18n.getUILanguage())
  return Object.entries(initVariables).reduce((prev, [k, v]) => (locale.startsWith(k) ? v : prev), initVariables.base)
}

export default useLocaleVariables
