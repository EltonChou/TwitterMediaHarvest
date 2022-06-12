import {
  DEFAULT_DIRECTORY,
  LOCAL_STORAGE_KEY_ARIA2,
} from '../../constants'
import {
  clearLocalStorage,
  fetchCookie,
  fetchLocalStorage,
  fetchSyncStorage,
  removeFromLocalStorage,
  setLocalStorage,
  setSyncStorage,
} from '../../libs/chromeApi'
import Statistics from '../libs/Statistics'
import DownloadRecordUtil from '../utils/DownloadRecordUtil'

export const fetchFileNameSetting = async (): Promise<FilenameSetting> => {
  const setting = await fetchSyncStorage([
    'directory',
    'no_subdirectory',
    'filename_pattern',
  ])
  return setting as unknown as FilenameSetting
}

/* eslint-disable no-console */
/**
 * Migrate storage to 3.0.0
 */
export const migrateStorage = async () => {
  console.groupCollapsed('Migration')
  console.info('Fetching old data...')
  const { aria2Flag } = await fetchLocalStorage([LOCAL_STORAGE_KEY_ARIA2])

  const initData: LocalStorageInitialData = {
    [LOCAL_STORAGE_KEY_ARIA2]: Boolean(aria2Flag),
    [StatisticsKey.ErrorCount]: await Statistics.getErrorCount(),
    [StatisticsKey.FailedDownloadCount]:
      await Statistics.getFailedDownloadCount(),
    [StatisticsKey.SuccessDownloadCount]:
      await Statistics.getSuccessDownloadCount(),
  }
  const { filename_pattern } = await fetchSyncStorage('filename_pattern')

  console.info('Clear old data...')
  await clearLocalStorage()

  console.info('Set local storage...')
  await setLocalStorage(initData)
  if (typeof filename_pattern === 'string') {
    console.info('Transforming filename_pattern data type...')
    await setSyncStorage({
      filename_pattern: JSON.parse(filename_pattern)
    })
  }

  console.info('Done.')
  console.groupEnd()
}

/**
 * Initialize storage
 */
export const initStorage = async () => {
  console.groupCollapsed('Initialization')
  console.info('Initializing storage...')
  const initSyncData: FilenameSetting = {
    directory: DEFAULT_DIRECTORY,
    no_subdirectory: false,
    filename_pattern: { serial: 'order', account: true }
  }
  const initLocalData: LocalStorageInitialData = {
    [LOCAL_STORAGE_KEY_ARIA2]: false,
    [StatisticsKey.ErrorCount]: 0,
    [StatisticsKey.FailedDownloadCount]: 0,
    [StatisticsKey.SuccessDownloadCount]: 0,
  }

  await setSyncStorage(initSyncData)
  await setLocalStorage(initLocalData)
  console.info('Done.')
  console.groupEnd()
}

export const fetchDownloadItemRecord = async (
  downloadItemId: number
): Promise<DownloadRecord | Record<string, never>> => {
  const recordId: DownloadRecordId = DownloadRecordUtil.createId(downloadItemId)
  const volume: { [key: DownloadRecordId]: DownloadRecord } =
    await fetchLocalStorage(recordId)
  if (recordId in volume) {
    return volume[recordId]
  }
  return {}
}

export const removeDownloadItemRecord = async (downloadItemId: number) => {
  const recordId = DownloadRecordUtil.createId(downloadItemId)
  await removeFromLocalStorage(recordId)
}

export const downloadItemRecorder =
  (tweetInfo: TweetInfo): DownloadItemRecorder => config => downloadId => {
    const recordId: DownloadRecordId = `dl_${downloadId}`
    const record: { [key: DownloadRecordId]: DownloadRecord } = {}

    record[recordId] = {
      info: tweetInfo,
      config: config,
    }

    setLocalStorage(record)
  }

export const enum StatisticsKey {
  SuccessDownloadCount = 'successDownloadCount',
  FailedDownloadCount = 'failedDownloadCount',
  ErrorCount = 'errorCount',
}

type DownloadStatistic = {
  [StatisticsKey.SuccessDownloadCount]?: number
  [StatisticsKey.FailedDownloadCount]?: number
  [StatisticsKey.ErrorCount]?: number
}

export const getStatisticsCount = async (
  key: StatisticsKey
): Promise<number> => {
  const downloadCount: DownloadStatistic = {}
  downloadCount[key] = 0

  const count = await fetchLocalStorage(downloadCount)
  count as { [key in StatisticsKey]: number }
  return count[key]
}

export const addStatisticsCount = async (key: StatisticsKey) => {
  const count = await getStatisticsCount(key)
  const downloadCount: DownloadStatistic = {}
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
