import select from 'select-dom'
import sanitize from 'sanitize-filename'
import { setStorage, fetchFileNameSetting } from './lib/chromeApi'

const accountCheckBox = select('#account')
const directoryInput = select('#directory')
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

const initializeInput = async () => {
  // eslint-disable-next-line no-undef
  fetchFileNameSetting().then(setting => {
    directoryInput.value = setting.directory
    accountCheckBox.checked = setting.filename_pattern.account
    const options = select.all('option')
    for (const option of options) {
      if (option.value === setting.filename_pattern.serial)
        option.selected = true
    }
    updatePreview()
  })
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

const serialSelect = select('select')
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
    account: accountCheckBox.checked,
    serial: serialSelect.value,
  }
  const fpResult = await setStorage({
    filename_pattern: JSON.stringify(filename_pattern),
  })

  console.info('Save settings.')
  console.table({ ...dirResult, ...fpResult })
  submitSuccess()
})
/* eslint-enable no-console */

function updatePreview() {
  let serial
  if (serialSelect.value === 'order') serial = example.serial_order
  if (serialSelect.value === 'file_name') serial = example.serial_name
  const theFilename = ''.concat(
    accountCheckBox.checked ? example.account : '',
    example.tweetId,
    '-',
    serial,
    example.ext
  )
  preview.value = theFilename
}

initializeInput()
