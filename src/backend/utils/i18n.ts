import browser from 'webextension-polyfill'

export const i18nLocalize = (kw: string, substitutions?: string | string[]) =>
  browser.i18n.getMessage(kw, substitutions)
