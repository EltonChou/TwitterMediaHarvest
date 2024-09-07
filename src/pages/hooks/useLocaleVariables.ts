import { useState } from 'react'
import { i18n } from 'webextension-polyfill'

export type SupportLocale = 'en' | 'ja' | 'zh'

export type LocaleVariableInit<T> = { fallback: T } & Partial<Record<SupportLocale, T>>

const useLocaleVariables = <T>(
  initVariables: LocaleVariableInit<T>,
  initLocale?: string
) => {
  const [locale] = useState(initLocale || i18n.getUILanguage())
  return Object.entries(initVariables).reduce(
    (prev, [k, v]) => (locale.startsWith(k) ? v : prev),
    initVariables.fallback
  )
}

export default useLocaleVariables
