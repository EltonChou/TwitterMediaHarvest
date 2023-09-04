import browser from 'webextension-polyfill'

export const i18n = (msg: string, subs?: string | string[]) =>
  browser.i18n.getMessage(msg, subs) || msg
