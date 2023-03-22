import sanitize from 'sanitize-filename'
import select from 'select-dom'
import StatisticsRepository, { StatisticsKey } from './statistics/repositories'
import { clearLocalStorage, clearSyncStorage } from '../libs/chromeApi'
import { Action, } from '../typings'
import { FilenameSerialRule } from './downloads/TwitterMediaFile'
import { initStorage } from './commands/storage'
import { storageConfig } from './configurations'

const filenameSettingsRepo = storageConfig.filenameSettingsRepo
const downloadSettingsRepo = storageConfig.downloadSettingsRepo

const noSubDirCheckBox: HTMLInputElement = select('#no_subdirectory')
const accountCheckBox: HTMLInputElement = select('#account')
const directoryInput: HTMLInputElement = select('#directory')
const serialSelect: HTMLSelectElement = select('select')
const aria2Control: HTMLInputElement = select('#aria2')
const videoThumbnailControl: HTMLInputElement = select('#videoThumbnail')
const aggressiveModeControl: HTMLInputElement = select('#aggressiveMode')
const settingsForm: HTMLFormElement = select('#settings')
const submitButton: HTMLButtonElement = select('#submit')
const resetStorageButton: HTMLInputElement = select('#reset_storage')
const directoryInputHelp = select('#directory-help')
const preview: HTMLInputElement = select('#preview')
const example = {
  account: 'twitterUser001-',
  tweetId: '1253677247493337088',
  serial_order: '02',
  serial_name: 'E9123klnWE90JHU',
  ext: '.jpg',
}

const updatePreview = () => {
  let serial = null
  if (serialSelect.value === FilenameSerialRule.Order) serial = example.serial_order
  if (serialSelect.value === FilenameSerialRule.Filename) serial = example.serial_name
  const filenameHead = accountCheckBox.checked ? example.account : ''
  const filenameQueue = [example.tweetId, '-', serial, example.ext]
  const theFilename = filenameHead.concat(...filenameQueue)
  preview.value = theFilename
}

const initializeForm = async () => {
  const filenameSettings = await filenameSettingsRepo.getSettings()
  const downloadSettings = await downloadSettingsRepo.getSettings()
  directoryInput.value = filenameSettings.directory
  noSubDirCheckBox.checked = filenameSettings.no_subdirectory
  if (noSubDirCheckBox.checked) {
    disableDirectoryInput()
  }
  accountCheckBox.checked = filenameSettings.filename_pattern.account
  aria2Control.checked = downloadSettings.enableAria2
  videoThumbnailControl.checked = downloadSettings.includeVideoThumbnail
  aggressiveModeControl.checked = downloadSettings.aggressive_mode
  const options = select.all('option')
  for (const option of options) {
    option.selected = option.value === filenameSettings.filename_pattern.serial
  }
}

const initializeStatistics = async () => {
  const statisticsQuery = '[data-category="statistics"]'
  const statisticsItems = select.all(statisticsQuery)
  const statisticsRepo = new StatisticsRepository(chrome.storage.local)
  for (const item of statisticsItems) {
    const count = await statisticsRepo.getStatisticsCount(item.dataset.type as StatisticsKey)
    item.textContent = count.toLocaleString()
  }
}

const disableSubmit = () => {
  submitButton.disabled = true
}
const allowSubmit = () => {
  updatePreview()
  submitButton.disabled = false
  submitButton.classList.remove('is-success')
  submitButton.innerText = chrome.i18n.getMessage('submitButtonText')
}
const submitSuccess = () => {
  submitButton.classList.add('is-success')
  submitButton.innerText = chrome.i18n.getMessage('submitButtonSuccessText')
  disableSubmit()
}

const disableDirectoryInput = () => {
  directoryInput.disabled = true
}
const enableDirectoryInput = () => {
  directoryInput.disabled = false
}

serialSelect.addEventListener('change', allowSubmit)
accountCheckBox.addEventListener('change', allowSubmit)
aria2Control.addEventListener('change', allowSubmit)
videoThumbnailControl.addEventListener('change', allowSubmit)
aggressiveModeControl.addEventListener('change', allowSubmit)
noSubDirCheckBox.addEventListener('change', () => {
  noSubDirCheckBox.checked ? disableDirectoryInput() : enableDirectoryInput()
  allowSubmit()
})

chrome.runtime.onMessage.addListener((msg: HarvestMessage, sender, sendResponse) => {
  if (msg.action === Action.Refresh) {
    initializeStatistics()
  }
  sendResponse(true)
})

directoryInput.addEventListener('input', function () {
  const filenameReg = new RegExp('^[\\w-_]+$')
  const sanitizedValue = sanitize(this.value)
  const isFileNameAllowed =
    filenameReg.test(this.value) && sanitizedValue === this.value

  if (isFileNameAllowed) {
    allowSubmit()
    directoryInputHelp.classList.add('is-hidden')
    this.classList.remove('is-danger')
    this.classList.add('is-success')
  } else {
    disableSubmit()
    directoryInputHelp.classList.remove('is-hidden')
    this.classList.add('is-danger')
    this.classList.remove('is-success')
  }
})

/* eslint-disable no-console */
settingsForm.addEventListener('submit', async function (e) {
  e.preventDefault()

  const downloadSettings: DownloadSettings = {
    enableAria2: Boolean(aria2Control.ariaChecked),
    includeVideoThumbnail: Boolean(videoThumbnailControl.checked),
    aggressive_mode: Boolean(aggressiveModeControl.checked)
  }

  const filenameSetting: FilenameSettings = {
    directory: directoryInput.value,
    no_subdirectory: noSubDirCheckBox.checked,
    filename_pattern: {
      account: accountCheckBox.checked,
      serial: serialSelect.value as FilenameSerialRule,
    }
  }

  const saveDownloadSettings = downloadSettingsRepo.saveSettings(downloadSettings)
  const saveFilenameSetting = filenameSettingsRepo.saveSettings(filenameSetting)

  Promise.all([saveDownloadSettings, saveFilenameSetting]).then(() => {
    console.info('Save settings.')
    console.table(filenameSetting)
    submitSuccess()
  })
})
/* eslint-enable no-console */

resetStorageButton.addEventListener('click', async () => {
  await clearLocalStorage()
  await clearSyncStorage()
  await initStorage()
  location.reload()
})

async function localize() {
  const localeObjects = select.all('[data-action="localize"]')
  for (const localObject of localeObjects) {
    const tag = localObject.innerHTML
    const localized = tag.replace(/__MSG_(\w+)__/g, (match, v1) => {
      return v1 ? chrome.i18n.getMessage(v1) : ''
    })
    localObject.innerHTML = localized
  }
}

localize().then(initializeForm).then(initializeStatistics).then(updatePreview)
