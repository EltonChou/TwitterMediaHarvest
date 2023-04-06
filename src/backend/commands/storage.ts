import { storageConfig } from '../configurations'
import browser from 'webextension-polyfill'

/* eslint-disable no-console */
export const initStorage = async () => {
  console.groupCollapsed('Initialization')
  console.info('Initializing storage...')

  await storageConfig.downloadSettingsRepo.setDefaultSettings()
  await storageConfig.statisticsRepo.setDefaultStatistics()
  await storageConfig.v4FilenameSettingsRepo.setDefaultSettings()
  await storageConfig.featureSettingsRepo.setDefaultSettings()

  await browser.storage.sync.set({ version: '4.0.0' })
  await browser.storage.local.set({ version: '4.0.0' })

  console.info('Done.')
  console.groupEnd()
}
/* eslint-enable no-console */

export const migrateStorageToV4 = async () => {
  let v = await browser.storage.sync.get('version')
  if (!('version' in v)) {
    console.groupCollapsed('Migrate storage to v4')

    // Migrate sync area
    console.info('Migrate sync')
    const v3Settings = await storageConfig.filenameSettingsRepo.getSettings()
    const filenamePattern: V4FilenamePattern = []
    if (v3Settings.filename_pattern.account) filenamePattern.push('{account}')
    filenamePattern.push('{tweetId}')
    filenamePattern.push(v3Settings.filename_pattern.serial === 'order' ? '{serial}' : '{hash}')

    const v4Settings: V4FilenameSettings = {
      noSubDirectory: v3Settings.no_subdirectory,
      directory: v3Settings.directory,
      filenamePattern: filenamePattern,
    }

    await browser.storage.sync.remove(Object.keys(v3Settings))
    await storageConfig.v4FilenameSettingsRepo.saveSettings(v4Settings)
    await browser.storage.sync.set({ version: '4.0.0' })
  }

  // Migrate local area
  v = await browser.storage.local.get('version')
  if (!('version' in v)) {
    console.info('Migrate local')
    const s = await browser.storage.local.get({ aggressive_mode: false })
    await browser.storage.local.set({ aggressiveMode: s.aggressive_mode })
    await browser.storage.local.set({ version: '4.0.0' })
    await browser.storage.local.remove('aggressive_mode')
  }

  console.groupEnd()
}
