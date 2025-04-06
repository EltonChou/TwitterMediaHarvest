/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { i18n } from 'webextension-polyfill'

export const i18nLocalize = (kw: string, substitutions?: string | string[]) =>
  i18n.getMessage(kw, substitutions)

/**
 * Web extension translation only allows `[A-Z][a-z][0-9]` and `_` as key.
 */
const makeMsgId = (text: string) => (context?: string) =>
  context ? `${context}_${text}` : text

const replaceMessagePlaceholders =
  (placeholders: Record<string, string>) => (message: string) =>
    Object.entries(placeholders).reduce(
      (msg, [key, value]) => msg.replaceAll(`{{${key.toLowerCase()}}}`, value),
      message
    )

export const getText = (
  text: string,
  context?: string,
  placeholders?: Record<string, string>
) => {
  const message = i18n.getMessage(makeMsgId(text)(context)) || text
  return placeholders
    ? replaceMessagePlaceholders(placeholders)(message)
    : message
}

export const getTextPlural = (
  count: number,
  text: string,
  pluralText: string,
  context?: string,
  placeholders?: Record<string, string>
) => {
  const targetText = count > 1 ? pluralText : text

  const message =
    i18n
      .getMessage(makeMsgId(targetText)(context))
      ?.replace(/\{\{[n|N]\}\}/, count.toString()) || targetText

  return placeholders
    ? replaceMessagePlaceholders(placeholders)(message)
    : message
}
