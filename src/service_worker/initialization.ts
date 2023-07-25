import type { IDownloadRecordsRepository } from '@backend/downloads/repositories'
import type { ISettingsRepository } from '@backend/settings/repository'
import type { DownloadSettings } from '@schema'
import browser from 'webextension-polyfill'

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
    chrome.downloads.onDeterminingFilename.removeListener(ensureFilename)
    console.log('Disable suggestion.')
  }

  const addSuggestion = () => {
    chrome.downloads.onDeterminingFilename.addListener(ensureFilename)
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
