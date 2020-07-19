const storageArea = Object.freeze({
  sync: chrome.storage.sync,
  local: chrome.storage.local,
})

/**
 * Fetch data from chrome storage.
 *
 * @async
 * @param {(string|string[]|Object)} any
 * @returns {promise}
 */
export const fetchSyncStorage = (any = null) =>
  new Promise(resolve => {
    chrome.storage.sync.get(any, result => resolve(result))
  })

export const fetchLocalStorage = (any = null) =>
  new Promise(resolve => {
    chrome.storage.local.get(any, result => resolve(result))
  })

/**
 * Set data to1 chrome storage.
 *
 * @async
 * @param {Object} obj
 * @returns {promise}
 */
export const setSyncStorage = obj =>
  new Promise(resolve => {
    chrome.storage.sync.set(obj, () => resolve(obj))
  })

export const setLocalStorage = obj =>
  new Promise(resolve => {
    chrome.storage.local.set(obj, () => resolve(obj))
  })

/**
 * @param {removerKeys} removerKeys
 * @returns { (removerKeys: string | Array<string> | number) => Promise }
 */
const storageRemover = storageArea => removerKeys => {
  removerKeys = removerKeysPretreat(removerKeys)

  return new Promise(resolve => {
    storageArea.remove(removerKeys, resolve)
  })
}

export const removeFromSyncStorage = storageRemover(storageArea.sync)
export const removeFromLocalStorage = storageRemover(storageArea.local)

export const clearSyncStorage = () =>
  new Promise(resolve => {
    chrome.storage.sync.clear(() => resolve())
  })

export const clearLocalStorage = () =>
  new Promise(resolve => {
    chrome.storage.local.clear(() => resolve())
  })

/**
 * Fetch chrome cookie
 *
 * @async
 * @param {Object} target
 * @returns {promise}
 */
export const fetchCookie = target =>
  new Promise(resolve => {
    chrome.cookies.get(target, cookie => resolve(cookie))
  })

export const i18nLocalize = kw => chrome.i18n.getMessage(kw)
export const getURL = path => chrome.runtime.getURL(path)

function removerKeysPretreat(keys) {
  if (typeof keys !== 'string') keys = String(keys)
  if (Array.isArray(keys)) keys.map(String)

  return keys
}
