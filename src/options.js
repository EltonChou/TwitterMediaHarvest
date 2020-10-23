import select from 'select-dom'
import sanitize from 'sanitize-filename'
import { setSyncStorage, i18nLocalize } from './libs/chromeApi'
import { fetchFileNameSetting, getDownloadCount } from './helpers/storageHelper'
import { LOCAL_STORAGE_KEY_ARIA2 } from './constants'

const accountCheckBox = select('#account')
const directoryInput = select('#directory')
const serialSelect = select('select')
const aria2Control = select('#aria2')
const settingsForm = select('#settings')
const submitButton = select('#submit')
const directoryInputHelp = select('#directory-help')
const preview = select('#preview')
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
  accountCheckBox.checked = setting.filename_pattern.account
  aria2Control.checked = JSON.parse(localStorage.getItem('enableAria2'))
  const options = select.all('option')
  for (const option of options) {
    option.selected = option.value === setting.filename_pattern.serial
  }
}

const initializeStatistics = async () => {
  const statisticsQuery = '[data-category="statistics"]'
  const statisticsItems = select.all(statisticsQuery)
  for (let item of statisticsItems) {
    const count = await getDownloadCount(item.dataset.type)
    item.textContent = count
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

serialSelect.addEventListener('change', allowSubmit)
accountCheckBox.addEventListener('change', allowSubmit)
aria2Control.addEventListener('change', allowSubmit)

directoryInput.addEventListener('input', function() {
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
settingsForm.addEventListener('submit', async function(e) {
  e.preventDefault()

  localStorage.setItem(LOCAL_STORAGE_KEY_ARIA2, aria2Control.checked)

  const dirResult = await setSyncStorage(
    Object.fromEntries([[directoryInput.name, directoryInput.value]])
  )
  const filename_pattern = {
    filename_pattern: JSON.stringify({
      account: accountCheckBox.checked,
      serial: serialSelect.value,
    }),
  }
  const filenamePatternResult = await setSyncStorage(filename_pattern)

  console.info('Save settings.')
  console.table({ ...dirResult, ...filenamePatternResult })
  submitSuccess()
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

localize()
  .then(initializeForm)
  .then(initializeStatistics)
  .then(updatePreview)
