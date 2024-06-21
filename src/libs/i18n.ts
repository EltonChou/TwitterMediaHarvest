import Browser from 'webextension-polyfill'

export const i18nLocalize = (kw: string, substitutions?: string | string[]) =>
  Browser.i18n.getMessage(kw, substitutions)
