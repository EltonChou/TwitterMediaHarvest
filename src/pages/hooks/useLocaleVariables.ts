/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useState } from 'react'
import { i18n } from 'webextension-polyfill'

export type SupportLocale = 'en' | 'ja' | 'zh'

export type LocaleVariableInit<T> = { fallback: T } & Partial<
  Record<SupportLocale, T>
>

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
