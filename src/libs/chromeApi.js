//FIXME: this should be a helper

/**
 * @type {Enumerator<chrome.storage.StorageArea>}
 */
const storageArea = Object.freeze({
  sync: chrome.storage.sync,
  local: chrome.storage.local,
})

/**
 * Fetch data from chrome storage.
 * Passing null keys to get all storage item.
 *
 * @param {chrome.storage.StorageArea} storageArea
 * @returns {(keys: string | string[] | Object | null) => Promise<{[key: string]: Object}}
 */
const storageFetcher = storageArea => {
  return (keys = null) => {
    return new Promise(resolve => {
      storageArea.get(keys, items => resolve(items))
    })
  }
}

/**
 * Set data to chrome storage.
 *
 * @param {chrome.storage.StorageArea} storageArea
 * @returns {(items: string | number | Object[] | Object) => Promise<void>}
 */
const storageSetter = storageArea => items => {
  return new Promise(resolve => {
    storageArea.set(items, () => resolve())
  })
}

const removerKeysPretreat = keys => {
  if (typeof keys !== 'string') keys = String(keys)
  if (Array.isArray(keys)) keys.map(String)

  return keys
}

/**
 * @param {chrome.storage.StorageArea} storageArea
 * @returns { (removerKeys: string | string[] | number) => Promise<void> }
 */
const storageRemover = storageArea => removerKeys => {
  removerKeys = removerKeysPretreat(removerKeys)

  return new Promise(resolve => {
    storageArea.remove(removerKeys, resolve)
  })
}

/**
 * @param {chrome.storage.StorageArea} storageArea
 * @returns { Promise<void> }
 */
const storageCleaner = storageArea => () => {
  return new Promise(resolve => {
    storageArea.clear(() => resolve())
  })
}

/**
 * Fetch chrome cookie
 *
 * @async
 * @param {Object} target
 * @returns { Promise<chrome.cookies.Cookie }
 */
export const fetchCookie = target =>
  new Promise(resolve => {
    chrome.cookies.get(target, cookie => resolve(cookie))
  })

/**
 *
 * @param {chrome.downloads.DownloadQuery} query
 * @returns { Promise<chrome.downloads.DownloadItem[]> }
 */
export const searchDownload = async query => {
  return new Promise(resolve => {
    chrome.downloads.search(query, items => resolve(items))
  })
}

/**
 * @param {string} kw i18n keyname
 */
export const i18nLocalize = kw => chrome.i18n.getMessage(kw)
/**
 * @param {string} path url path
 */
export const getExtensionURL = path => chrome.runtime.getURL(path)
export const getExtensionId = () => chrome.runtime.id

export const fetchSyncStorage = storageFetcher(storageArea.sync)
export const fetchLocalStorage = storageFetcher(storageArea.local)
export const setSyncStorage = storageSetter(storageArea.sync)
export const setLocalStorage = storageSetter(storageArea.local)
export const removeFromSyncStorage = storageRemover(storageArea.sync)
export const removeFromLocalStorage = storageRemover(storageArea.local)
export const clearSyncStorage = storageCleaner(storageArea.sync)
export const clearLocalStorage = storageCleaner(storageArea.local)
