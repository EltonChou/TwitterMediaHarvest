export type BrowserStorageFetcher = (
  keys: string | string[] | object | null
) => Promise<{
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}>

export type BrowserStorageSetter = (items: object) => Promise<void>
export type BrowserStorageRemover = (keyToRemove: string | string[]) => Promise<void>

/**
 * @param {string} kw i18n keyname
 */
export const i18nLocalize = process.env.MANIFEST === '3' ?
  (kw: string) => {
    const userLocale = new Intl.Locale(chrome.i18n.getUILanguage())
    const langMapping = {
      en: import('../_locales/en/messages.json'),
      ja: import('../_locales/ja/messages.json'),
      zh: import('../_locales/zh_TW/messages.json')
    }

    const locale = Object.keys(langMapping).includes(userLocale.language)
      // @ts-expect-error monkey patch
      ? langMapping[userLocale.language]
      : langMapping.en

    return locale[kw]['message']
  } : (kw: string) => chrome.i18n.getMessage(kw)

/**
 * Fetch data from chrome storage.
 * Passing null keys to get all storage item.
 */
export const storageFetcher = (
  storageArea: chrome.storage.StorageArea
): BrowserStorageFetcher => (
  keys = null
) => new Promise(
  resolve => {
    storageArea.get(keys, items => resolve(items))
  })


/**
 * Set data to chrome storage.
 *
 * @param storageArea
 */
export const storageSetter = (
  storageArea: chrome.storage.StorageArea
): BrowserStorageSetter =>
  items => new Promise(resolve => {
    storageArea.set(items, resolve)
  })

const removerKeysPretreat = (keys: string | string[]) => {
  if (typeof keys !== 'string') keys = String(keys)
  if (Array.isArray(keys)) keys.map(String)

  return keys
}

/**
 * @param storageArea
 */
export const storageRemover = (
  storageArea: chrome.storage.StorageArea
): BrowserStorageRemover => removerKeys => {
  removerKeys = removerKeysPretreat(removerKeys)
  return new Promise(resolve => {
    storageArea.remove(removerKeys, resolve)
  })
}

/**
 * @param storageArea
 */
const storageCleaner =
  (storageArea: chrome.storage.StorageArea) => (): Promise<void> =>
    new Promise(resolve => {
      storageArea.clear(() => resolve())
    })

/**
 * Fetch chrome cookie
 */
export const fetchCookie = (
  target: chrome.cookies.Details
): Promise<chrome.cookies.Cookie> =>
  new Promise(resolve => {
    chrome.cookies.get(target, cookie => resolve(cookie))
  })

/**
 * Search browser download history with query.
 *
 * @param query
 */
export const searchDownload = async (
  query: chrome.downloads.DownloadQuery
): Promise<chrome.downloads.DownloadItem[]> => {
  return new Promise(resolve => {
    chrome.downloads.search(query, items => resolve(items))
  })
}

/**
 * @param {string} path url path
 */
export const getExtensionURL = (path: string) => chrome.runtime.getURL(path)
export const getExtensionId = () => chrome.runtime.id
export const openOptionsPage = () => chrome.runtime.openOptionsPage()

export const fetchSyncStorage = storageFetcher(chrome.storage.sync)
export const fetchLocalStorage = storageFetcher(chrome.storage.local)
export const setSyncStorage = storageSetter(chrome.storage.sync)
export const setLocalStorage = storageSetter(chrome.storage.local)
export const removeFromSyncStorage = storageRemover(chrome.storage.sync)
export const removeFromLocalStorage = storageRemover(chrome.storage.local)
export const clearSyncStorage = storageCleaner(chrome.storage.sync)
export const clearLocalStorage = storageCleaner(chrome.storage.local)
