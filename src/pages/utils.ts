/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export const testIdProps = (testId: string) => ({ 'data-testid': testId })

export const enum TextDirection {
  LTR = 'ltr',
  RTL = 'rtl',
}

// ponytail: only RTL locales we ship a .po for; `@@bidi_dir` follows the browser
// language and would flip the English fallback. Add 'he' / 'fa' with their .po files.
const RTL_LOCALES = new Set(['ar'])

/**
 * @param uiLanguage `i18n.getUILanguage()` value, e.g. `en-US` or `ar`.
 */
export const getTextDirection = (uiLanguage: string): TextDirection =>
  RTL_LOCALES.has(uiLanguage.split(/[-_]/)[0].toLowerCase())
    ? TextDirection.RTL
    : TextDirection.LTR
