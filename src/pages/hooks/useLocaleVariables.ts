import { useState } from 'react'
import { i18n } from 'webextension-polyfill'

export type SupportLocale = 'en' | 'ja' | 'zh'

type LocalVariableInit<T> = { base: T } & Partial<Record<SupportLocale, T>>

const useLocaleVariables = <T>(
  initVariables: LocalVariableInit<T>,
  initLocale?: string
) => {
  const [locale] = useState(initLocale || i18n.getUILanguage())
  return Object.entries(initVariables).reduce(
    (prev, [k, v]) => (locale.startsWith(k) ? v : prev),
    initVariables.base
  )
}

export default useLocaleVariables
