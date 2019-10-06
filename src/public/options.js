let saveButton = document.querySelector('button')
let directoryInput = document.querySelector('#directory')

// eslint-disable-next-line no-undef
chrome.storage.sync.get(['directory'], function(value) {
  directoryInput.value = value.directory || 'twitter_media_harvest'
})

saveButton.addEventListener('click', () => {
  let data = {
    directory: directoryInput.value,
  }
  // eslint-disable-next-line no-undef
  chrome.storage.sync.set(data, () => {
    // eslint-disable-next-line no-console
    console.log('Downloads directory set to ', directoryInput.value)
  })
})
