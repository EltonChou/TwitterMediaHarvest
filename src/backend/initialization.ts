import browser from 'webextension-polyfill'
import type { IDownloadRecordsRepository } from './downloadRecords/repository'
import type { ISettingsRepository } from './settings/repository'

export const chromiumInit = (
  downloadSettingsRepo: ISettingsRepository<DownloadSettings>,
  downloadRecordRepo: IDownloadRecordsRepository
) => {
  const ensureFilename = (
    downloadItem: chrome.downloads.DownloadItem,
    suggest: (suggestion?: chrome.downloads.DownloadFilenameSuggestion) => void
  ) => {
    const { byExtensionId } = downloadItem
    const runtimeId = browser.runtime.id

    if (byExtensionId && byExtensionId === runtimeId) {
      downloadRecordRepo.getById(downloadItem.id).then(record => {
        if (!record) return false
        const { downloadConfig } = record
        suggest(downloadConfig as chrome.downloads.DownloadFilenameSuggestion)
      })
      return true
    } else if (byExtensionId && byExtensionId !== runtimeId) {
      return true
    }
    // if extensionId is undefined, it was trigger by the browser.
    suggest()
  }

  const removeSuggestion = () => {
    if (chrome.downloads.onDeterminingFilename.hasListener(ensureFilename)) {
      chrome.downloads.onDeterminingFilename.removeListener(ensureFilename)
    }
    console.log('Disable suggestion.')
  }

  const addSuggestion = () => {
    if (!chrome.downloads.onDeterminingFilename.hasListener(ensureFilename)) {
      chrome.downloads.onDeterminingFilename.addListener(ensureFilename)
    }
    console.log('Enable suggestion')
  }

  browser.storage.onChanged.addListener((changes, areaName) => {
    const AggressiveModeKey = 'aggressiveMode'
    if (AggressiveModeKey in changes) {
      changes[AggressiveModeKey].newValue ? addSuggestion() : removeSuggestion()
    }
  })

  downloadSettingsRepo.getSettings().then(downloadSettings => {
    if (downloadSettings.aggressiveMode) addSuggestion()
  })
}

export const firefoxInit = () => {
  /**pass */
}
