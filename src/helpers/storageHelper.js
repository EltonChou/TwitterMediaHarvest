import {
  CHROME_STORAGE_DEFAULT_FILENAME_PATTERN_OBJECT_STRING,
  DEFAULT_DIRECTORY,
  LOCAL_STORAGE_KEY_ARIA2,
} from '../constants'
import {
  fetchSyncStorage,
  setSyncStorage,
  fetchLocalStorage,
  setLocalStorage,
  fetchCookie,
  clearLocalStorage,
} from '../libs/chromeApi'

import Statistics from '../libs/Statistics'

export const statisticsKey = Object.freeze({
  successDownloadCount: 'successDownloadCount',
  failedDownloadCount: 'failedDownloadCount',
  errorCount: 'errorCount',
})

/**
 * @typedef {Object} tweetInfo
 * @property {string} screenName
 * @property {string} tweetId
 *
 * @typedef patternSetting
 * @type {Object}
 * @property {Boolean} account
 * @property {'order' | 'file_name'} serial - `order` or `file_name`
 *
 * @typedef fileNameSetting
 * @type {Object}
 * @property {String} directory
 * @property {Boolean} no_subdirectory
 * @property {patternSetting} filename_pattern
 *
 */
/**
 * @returns { Promise<fileNameSetting> }
 */
export const fetchFileNameSetting = async () => {
  const setting = await fetchSyncStorage([
    'directory',
    'no_subdirectory',
    'filename_pattern',
  ])
  setting.filename_pattern = JSON.parse(setting.filename_pattern)

  return setting
}

/* eslint-disable no-console */
/**
 * Migrate storage to 3.0.0
 */
export const migrateStorage = async () => {
  console.groupCollapsed('Migration')
  console.info('Fetching old data...')
  const { aria2Flag } = await fetchLocalStorage([LOCAL_STORAGE_KEY_ARIA2])
  const initData = {}
  initData[LOCAL_STORAGE_KEY_ARIA2] = Boolean(aria2Flag)
  initData[statisticsKey.errorCount] = await Statistics.getErrorCount()
  initData[statisticsKey.failedDownloadCount] =
    await Statistics.getFailedDownloadCount()
  initData[statisticsKey.successDownloadCount] =
    await Statistics.getSuccessDownloadCount()

  console.info('Migrating...')
  console.info('Clear old data.')
  await clearLocalStorage()

  console.info('Filling data...')
  const result = setLocalStorage(initData)
  console.info('Done.')

  console.table({ ...result })
  console.groupEnd()
  console.warn(
    'The default serial of filename would be changed into order of the file in next version.'
  )
}

/**
 * Initialize storage
 */
export const initStorage = async () => {
  console.groupCollapsed('Initialization')
  console.info('Initializing storage...')
  const result = await setSyncStorage({
    directory: DEFAULT_DIRECTORY,
    filename_pattern: CHROME_STORAGE_DEFAULT_FILENAME_PATTERN_OBJECT_STRING,
  })
  const initLocalData = {}
  initLocalData[LOCAL_STORAGE_KEY_ARIA2] = false
  await setLocalStorage(initLocalData)
  console.info('Done.')
  console.table(result)
  console.groupEnd()
}

/**
 * @param {number} downloadItemId
 */
export const fetchDownloadItemRecord = async downloadItemId => {
  const volume = await fetchLocalStorage(String(downloadItemId))
  const downloadItemRecord = JSON.parse(volume[downloadItemId])
  return downloadItemRecord
}

/**
 * @param {tweetInfo} tweetInfo
 * @returns {(config) => (downloadId:number) => void}
 */
export const downloadItemRecorder = tweetInfo => config => downloadId => {
  const record = {}

  record[downloadId] = JSON.stringify({
    info: tweetInfo,
    config: config,
  })

  setLocalStorage(record)
}

export const getStatisticsCount = async key => {
  const downloadCount = {}
  downloadCount[key] = 0

  const count = await fetchLocalStorage(downloadCount)
  return count[key]
}

export const addStatisticsCount = async key => {
  const count = await getStatisticsCount(key)
  const downloadCount = {}
  downloadCount[key] = count + 1

  await setLocalStorage(downloadCount)
}

export const fetchTwitterCt0Cookie = async () => {
  const { value } = await fetchCookie({
    url: 'https://twitter.com',
    name: 'ct0',
  })

  return value
}

export const isEnableAria2 = async () => {
  const { aria2Flag } = await fetchLocalStorage(LOCAL_STORAGE_KEY_ARIA2)
  return Boolean(aria2Flag)
}
