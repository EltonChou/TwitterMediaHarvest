import {
  CHROME_STORAGE_DEFAULT_FILENAME_PATTERN_OBJECT_STRING,
  DEFAULT_DIRECTORY,
} from '../constants'
import {
  fetchSyncStorage,
  setSyncStorage,
  clearSyncStorage,
  fetchLocalStorage,
  setLocalStorage,
  fetchCookie,
} from '../libs/chromeApi'

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
 * @returns {fileNameSetting}
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
 * Migrate storer from 1.1.6
 */
export const migrateStorage = async () => {
  console.groupCollapsed('Migration')
  console.info('Fetching old data...')
  const { directory, needAccount } = await fetchSyncStorage([
    'directory',
    'needAccount',
  ])

  console.info('Migrating...')
  const filename_pattern = {
    account: typeof needAccount === Boolean ? needAccount : true,
    serial: 'file_name',
  }

  console.info('Clear old data.')
  await clearSyncStorage()

  const dirResult = await setSyncStorage({ directory: directory })
  const fpResult = await setSyncStorage({
    filename_pattern: JSON.stringify(filename_pattern),
  })
  console.info('Done.')
  console.table({ ...dirResult, ...fpResult })
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
