import {
  CHROME_STORAGE_DEFAULT_FILENAME_PATTERN_OBJECT_STRING,
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
import Statistics from '../../libs/Statistics'
import { makeDownloadRecordId } from '../utils/maker'
import {
  DownloadItemRecorder,
  DownloadRecord,
  DownloadRecordId,
  FilenameSetting,
  LocalStorageInitialData,
  StatisticsKey,
  TweetInfo,
} from '../../typings'

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

  console.info('Migrating...')
  console.info('Clear old data.')
  await clearLocalStorage()

  console.info('Filling data...')
  const result = setLocalStorage(initData)
  console.info('Done.')

  console.table({ ...result })
  console.groupEnd()
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
  const initLocalData: LocalStorageInitialData = {
    [LOCAL_STORAGE_KEY_ARIA2]: false,
    [StatisticsKey.ErrorCount]: 0,
    [StatisticsKey.FailedDownloadCount]: 0,
    [StatisticsKey.SuccessDownloadCount]: 0,
  }

  await setLocalStorage(initLocalData)
  console.info('Done.')
  console.table(result)
  console.groupEnd()
}

export const fetchDownloadItemRecord = async (
  downloadItemId: number
): Promise<DownloadRecord | Record<string, never>> => {
  const recordId: DownloadRecordId = `dl_${downloadItemId}`
  const volume: { [key: DownloadRecordId]: DownloadRecord } =
    await fetchLocalStorage(recordId)
  if (recordId in volume) {
    return volume[recordId]
  }
  return {}
}

export const removeDownloadItemRecord = async (downloadItemId: number) => {
  const recordId = makeDownloadRecordId(downloadItemId)
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
