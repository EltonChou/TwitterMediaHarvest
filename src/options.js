import select from 'select-dom'
import sanitize from 'sanitize-filename'
import { setStorage } from './lib/chromeApi'
import { fetchFileNameSetting } from './utils/storageHelper'

const accountCheckBox = select('#account')
const directoryInput = select('#directory')
const serialSelect = select('select')
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
  const theFilename = filenameHead.concat(filenameQueue)
  preview.value = theFilename
}

const initializeInput = async () => {
  // eslint-disable-next-line no-undef
  const setting = await fetchFileNameSetting()
  directoryInput.value = setting.directory
  accountCheckBox.checked = setting.filename_pattern.account
  const options = select.all('option')
  for (const option of options) {
    option.selected = option.value === setting.filename_pattern.serial
  }
}

const disableSubmit = () => {
  submitButton.disabled = true
}
const allowSubmit = () => {
  updatePreview()
  submitButton.disabled = false
  submitButton.classList.remove('is-success')
  submitButton.innerText = 'Save'
}
const submitSuccess = () => {
  submitButton.classList.add('is-success')
  submitButton.innerText = 'Success!'
  disableSubmit()
}

serialSelect.addEventListener('change', allowSubmit)
accountCheckBox.addEventListener('change', allowSubmit)

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
  const dirResult = await setStorage(
    Object.fromEntries([[directoryInput.name, directoryInput.value]])
  )
  const filename_pattern = {
    filename_pattern: JSON.stringify({
      account: accountCheckBox.checked,
      serial: serialSelect.value,
    }),
  }
  const fpResult = await setStorage(filename_pattern)

  console.info('Save settings.')
  console.table({ ...dirResult, ...fpResult })
  submitSuccess()
})
/* eslint-enable no-console */

initializeInput().then(updatePreview)
