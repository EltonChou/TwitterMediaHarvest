import { storageConfig } from '../configurations'

/* eslint-disable no-console */
export const initStorage = async () => {
  console.groupCollapsed('Initialization')
  console.info('Initializing storage...')

  await storageConfig.downloadSettingsRepo.setDefaultSettings()
  await storageConfig.filenameSettingsRepo.setDefaultSettings()
  await storageConfig.statisticsRepo.setDefaultStatistics()

  console.info('Done.')
  console.groupEnd()
}
/* eslint-enable no-console */
