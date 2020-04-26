import {
  CHROME_STORAGE_DEFAULT_FILENAME_PATTERN_OBJECT_STRING,
  DEFAULT_DIRECTORY,
} from '../constants'
import { fetchStorage, setStorage, clearStorage } from '../lib/chromeApi'

/**
 * Fetch settings
 *
 * @typedef patternSetting
 * @type {Object}
 * @property {Boolean} account
 * @property {'order' | 'file_name'} serial - `order` or `file_name`
 *
 * @typedef fileNameSetting
 * @type {Object}
 * @property {String} directory
 * @property {patternSetting} filename_pattern
 *
 * @async
 * @return {Promise<fileNameSetting>}
 */
export const fetchFileNameSetting = async () => {
  const setting = await fetchStorage(['directory', 'filename_pattern'])
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
  const { directory, needAccount } = await fetchStorage([
    'directory',
    'needAccount',
  ])

  console.info('Migrating...')
  const filename_pattern = {
    account: typeof needAccount === Boolean ? needAccount : true,
    serial: 'file_name',
  }

  console.info('Clear old data.')
  await clearStorage()

  const dirResult = await setStorage({ directory: directory })
  const fpResult = await setStorage({
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
  const result = await setStorage({
    directory: DEFAULT_DIRECTORY,
    filename_pattern: CHROME_STORAGE_DEFAULT_FILENAME_PATTERN_OBJECT_STRING,
  })
  console.info('Done.')
  console.table(result)
  console.groupEnd()
}
