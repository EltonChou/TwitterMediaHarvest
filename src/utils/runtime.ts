import Browser from 'webextension-polyfill'

export const getVersion = () => Browser.runtime.getManifest().version

export const getFullVersion = () =>
  Browser.runtime.getManifest().version_name ?? getVersion()

export const getRuntimeId = () => Browser.runtime.id
