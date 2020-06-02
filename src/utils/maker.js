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
  Object.assign(button.dataset, data)
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
}

/**
 * Create browser download config object.
 *
 * @param {String} url
 * @param {String} fileName
 */
export const makeBrowserDownloadConfig = (url, fileName) => {
  return {
    url: url,
    filename: fileName,
    conflictAction: 'overwrite',
  }
}

/**
 * Create aria2 download config object.
 *
 * @param {String} url
 * @param {String} fileName
 * @param {String} referrer
 */
export const makeAria2DownloadConfig = (
  url,
  fileName,
  referrer = undefined
) => {
  // eslint-disable-next-line no-undef
  referrer = referrer || chrome.runtime.getURL('options.html')

  return {
    url: url,
    filename: fileName,
    referrer: referrer,
    options: {},
  }
}
