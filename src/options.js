import select from 'select-dom'
import sanitize from 'sanitize-filename'
import { fetchStorage, setStorage } from './lib/chromeApi'
import { DEFAULT_DIRECTORY } from './constants'

let inputs = select.all('input')
let directoryInput = select('#directory')
let settingsForm = select('#settings')
const submitButton = select('#submit')
const directoryInputHelp = select('#directory-help')
const checkboxs = select.all('input[type="checkbox"]')

const initializeInput = async () => {
  // eslint-disable-next-line no-undef
  fetchStorage({ directory: DEFAULT_DIRECTORY }).then(value => {
    directoryInput.value = value.directory
  })
  for (let input of inputs) {
    if (input.type === 'checkbox') {
      const result = await fetchStorage(input.name)
      input.checked =
        result[input.name] === undefined ? true : result[input.name]
    }
  }
}

const disableSubmit = () => {
  submitButton.disabled = true
}
const allowSubmit = () => {
  submitButton.disabled = false
  submitButton.classList.remove('is-success')
  submitButton.innerText = 'Save'
}
const submitSuccess = () => {
  submitButton.classList.add('is-success')
  submitButton.innerText = 'Success!'
  disableSubmit()
}

for (let checkbox of checkboxs) {
  checkbox.addEventListener('change', allowSubmit)
}

directoryInput.addEventListener('input', function() {
  allowSubmit()
  const filenameReg = new RegExp('^[\\w-_]+$')
  const sanitizedValue = sanitize(this.value)
  const isFileNameAllowed =
    filenameReg.test(this.value) && sanitizedValue === this.value

  if (isFileNameAllowed) {
    submitButton.disabled = false
    directoryInputHelp.classList.add('is-hidden')
    this.classList.remove('is-danger')
    this.classList.add('is-success')
  } else {
    submitButton.disabled = true
    directoryInputHelp.classList.remove('is-hidden')
    this.classList.add('is-danger')
    this.classList.remove('is-success')
  }
})

settingsForm.addEventListener('submit', async function(e) {
  e.preventDefault()
  for (let input of inputs) {
    let result
    if (input.type === 'text') {
      result = await setStorage(Object.fromEntries([[input.name, input.value]]))
    }
    if (input.type === 'checkbox') {
      result = await setStorage(
        Object.fromEntries([[input.name, input.checked]])
      )
    }
    for (let key in result) {
      // eslint-disable-next-line no-console
      console.log(`${key} set to ${result[key]}`)
    }
  }
  submitSuccess()
})

initializeInput()
