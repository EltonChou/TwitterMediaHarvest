import {
  DEFAULT_DIRECTORY,
  CHROME_STORAGE_DEFAULT_FILENAME_PATTERN_OBJECT_STRING,
} from '../constants'

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

/**
 * serial would be `order` or `file_name`
 * @typedef patternSetting
 * @type {Object}
 * @property {Boolean} account
 * @property {String} serial - `order` or `file_name`
 */
/**
 * @typedef fileNameSetting
 * @type {Object}
 * @property {String} directory
 * @property {patternSetting} filename_pattern
 *
 */
/**
 * Fetch settings
 *
 * @async
 * @return {Promise<fileNameSetting>}
 */
export const fetchFileNameSetting = async () => {
  const defaultSetting = {
    directory: DEFAULT_DIRECTORY,
    filename_pattern: CHROME_STORAGE_DEFAULT_FILENAME_PATTERN_OBJECT_STRING,
  }

  const setting = await fetchStorage(defaultSetting)
  setting.filename_pattern = JSON.parse(setting.filename_pattern)

  return setting
}
