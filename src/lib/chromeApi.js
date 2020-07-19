/**
 * Fetch data from chrome storage.
 *
 * @async
 * @param {(string|string[]|Object)} any
 * @returns {promise}
 */
export const fetchSyncStorage = any =>
  new Promise(resolve => {
    // eslint-disable-next-line no-undef
    chrome.storage.sync.get(any, result => resolve(result))
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
    // eslint-disable-next-line no-undef
    chrome.storage.sync.set(obj, () => resolve(obj))
  })

export const clearSyncStorage = () =>
  new Promise(resolve => {
    // eslint-disable-next-line no-undef
    chrome.storage.sync.clear(() => resolve())
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
    // eslint-disable-next-line no-undef
    chrome.cookies.get(target, cookie => resolve(cookie))
  })

// eslint-disable-next-line no-undef
export const i18nLocalize = kw => chrome.i18n.getMessage(kw)
// eslint-disable-next-line no-undef
export const getURL = path => chrome.runtime.getURL(path)
