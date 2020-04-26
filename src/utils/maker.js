/**
 * Create HTMLElement from html string.
 *
 * @param {InnerHTML} htmlString A valid html.
 * @returns {Element} A valid HTML element
 */
export const createElementFromHTML = htmlString => {
  // eslint-disable-next-line no-undef
  const wrapper = document.createElement('div')
  wrapper.innerHTML = htmlString.trim()
  return wrapper.firstChild
}

/**
 *
 * @param {Element} button
 * @param {Object} data
 *
 * @returns {Element}
 */
export const makeButtonWithData = (button, data) => {
  for (let key in data) {
    button.dataset[key] = data[key]
  }
  return button
}

/**
 *
 * @param {Element} button harvestButton
 *
 * @returns {Element} button
 */
export const makeButtonListener = button => {
  button.addEventListener('click', function(e) {
    e.stopImmediatePropagation()
    // eslint-disable-next-line no-undef
    chrome.runtime.sendMessage(this.dataset)
  })
  return button
}

/**
 * Create chrome download config object.
 *
 * @param {String} url
 * @param {String} fileName
 */
export const makeChromeDownloadConfig = (url, fileName) => {
  return {
    url: url,
    filename: fileName,
    conflictAction: 'overwrite',
  }
}
