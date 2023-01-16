import { StatisticsKey } from '../statistics/repositories'
import {
  DEFAULT_DIRECTORY,
} from '../../constants'
import {
  setLocalStorage,
  setSyncStorage,
} from '../../libs/chromeApi'


type LocalStorageInitialData = {
  [StatisticsKey.SuccessDownloadCount]: number
  [StatisticsKey.FailedDownloadCount]: number
  [StatisticsKey.ErrorCount]: number
}

/* eslint-disable no-console */
export const initStorage = async () => {
  console.groupCollapsed('Initialization')
  console.info('Initializing storage...')
  const defaultFilenameSettings: FilenameSettings = {
    directory: DEFAULT_DIRECTORY,
    no_subdirectory: false,
    filename_pattern: { serial: 'order', account: true }
  }
  const defaultDownloadSettings: DownloadSettings = {
    enableAria2: false,
    includeVideoThumbnail: false
  }
  const initSyncData = {...defaultFilenameSettings }
  const initLocalData: LocalStorageInitialData = {
    ...defaultDownloadSettings,
    [StatisticsKey.ErrorCount]: 0,
    [StatisticsKey.FailedDownloadCount]: 0,
    [StatisticsKey.SuccessDownloadCount]: 0,
  }

  await setSyncStorage(initSyncData)
  await setLocalStorage(initLocalData)
  console.info('Done.')
  console.groupEnd()
}
/* eslint-enable no-console */
