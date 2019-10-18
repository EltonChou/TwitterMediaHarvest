/**
 * Fetch data from chrome storage.
 *
 * @param {(string|string[]|Object)} any
 * @returns {promise}
 */
const fetchStorage = any =>
  new Promise(resolve => {
    // eslint-disable-next-line no-undef
    chrome.storage.sync.get(any, result => resolve(result))
  })

const setStorage = obj =>
  new Promise(resolve => {
    // eslint-disable-next-line no-undef
    chrome.storage.sync.set(obj, () => resolve(obj))
  })

/**
 * Fetch chrome cookie
 *
 * @param {Object} target
 * @returns {promise}
 */
const fetchCookie = target =>
  new Promise(resolve => {
    // eslint-disable-next-line no-undef
    chrome.cookies.get(target, cookie => resolve(cookie))
  })

export { setStorage, fetchCookie, fetchStorage }
