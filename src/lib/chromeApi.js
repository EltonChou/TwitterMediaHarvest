/**
 * Fetch data from chrome storage.
 *
 * @async
 * @param {(string|string[]|Object)} any
 * @returns {promise}
 */
export const fetchStorage = any =>
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
export const setStorage = obj =>
  new Promise(resolve => {
    // eslint-disable-next-line no-undef
    chrome.storage.sync.set(obj, () => resolve(obj))
  })

export const clearStorage = () =>
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
