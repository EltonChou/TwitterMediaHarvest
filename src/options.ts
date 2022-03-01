import select from 'select-dom'
import sanitize from 'sanitize-filename'
import { setSyncStorage, i18nLocalize, setLocalStorage } from './libs/chromeApi'
import {
  fetchFileNameSetting,
  getStatisticsCount,
  isEnableAria2,
} from './helpers/storageHelper'
import { LOCAL_STORAGE_KEY_ARIA2 } from './constants'
import { FilenameSetting, StatisticsKey, Action, HarvestMessage } from './typings'

const noSubDirCheckBox: HTMLInputElement = select('#no_subdirectory')
const accountCheckBox: HTMLInputElement = select('#account')
const directoryInput: HTMLInputElement = select('#directory')
const serialSelect: HTMLSelectElement = select('select')
const aria2Control: HTMLInputElement = select('#aria2')
const settingsForm: HTMLFormElement = select('#settings')
const submitButton: HTMLButtonElement = select('#submit')
const directoryInputHelp = select('#directory-help')
const preview: HTMLInputElement = select('#preview')
const example = {
  account: 'twitterUser001-',
  tweetId: '1253677247493337088',
  serial_order: '03',
  serial_name: 'E9123klnWE90JHU',
  ext: '.jpg',
}

const updatePreview = () => {
  let serial = null
  if (serialSelect.value === 'order') serial = example.serial_order
  if (serialSelect.value === 'file_name') serial = example.serial_name
  const filenameHead = accountCheckBox.checked ? example.account : ''
  const filenameQueue = [example.tweetId, '-', serial, example.ext]
  const theFilename = filenameHead.concat(...filenameQueue)
  preview.value = theFilename
}

const initializeForm = async () => {
  const setting = await fetchFileNameSetting()
  directoryInput.value = setting.directory
  noSubDirCheckBox.checked = Boolean(setting.no_subdirectory)
  if (noSubDirCheckBox.checked) {
    disableDirectoryInput()
  }
  accountCheckBox.checked = setting.filename_pattern.account
  aria2Control.checked = await isEnableAria2()
  const options = select.all('option')
  for (const option of options) {
    option.selected = option.value === setting.filename_pattern.serial
  }
}

const initializeStatistics = async () => {
  const statisticsQuery = '[data-category="statistics"]'
  const statisticsItems = select.all(statisticsQuery)
  for (const item of statisticsItems) {
    const count = await getStatisticsCount(item.dataset.type as StatisticsKey)
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
noSubDirCheckBox.addEventListener('change', () => {
  noSubDirCheckBox.checked ? disableDirectoryInput() : enableDirectoryInput()
  allowSubmit()
})

chrome.runtime.onMessage.addListener((msg: HarvestMessage) => {
  if (msg.action === Action.Refresh) {
    initializeStatistics()
  }
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

  const aria2Config: { [key: string]: boolean } = {}
  aria2Config[LOCAL_STORAGE_KEY_ARIA2] = Boolean(aria2Control.ariaChecked)

  const filenameSetting: FilenameSetting = {
    ...Object.fromEntries([
      [directoryInput.name, directoryInput.value],
      [noSubDirCheckBox.name, noSubDirCheckBox.checked]
    ]),
    account: accountCheckBox.checked,
    serial: serialSelect.value,
  }

  const saveAria2 = setLocalStorage(aria2Config)
  const saveFilenameSetting = setSyncStorage(filenameSetting)

  Promise.all([saveAria2, saveFilenameSetting]).then(() => {
    console.info('Save settings.')
    console.table(filenameSetting)
    submitSuccess()
  })
})
/* eslint-enable no-console */

async function localize() {
  const localeObjects = select.all('[data-action="localize"]')
  for (const localObject of localeObjects) {
    const tag = localObject.innerHTML
    const localized = tag.replace(/__MSG_(\w+)__/g, (match, v1) => {
      return v1 ? i18nLocalize(v1) : ''
    })
    localObject.innerHTML = localized
  }
}


Promise.all([localize, initializeForm, initializeStatistics]).then(updatePreview)
