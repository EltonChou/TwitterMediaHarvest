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
 * @typedef browserDownloadConfig
 * @type {Object}
 * @property {String} url
 * @property {String} fileName
 * @property {String} conflictAction
 *
 *
 * @typedef aria2DownloadConfig
 * @type {Object}
 * @property {String} url
 * @property {String} fileName
 * @property {String} referrer
 * @property {Object} options
 *
 */
/**
 * Create browser download config object.
 *
 * @param {String} url
 * @param {String} fileName
 *
 * @returns {browserDownloadConfig}
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
 * @param {Object} options aria2 options
 *
 * @returns {aria2DownloadConfig}
 */
export const makeAria2DownloadConfig = (
  url,
  fileName,
  referrer = undefined,
  options = {}
) => {
  // eslint-disable-next-line no-undef
  referrer |= chrome.runtime.getURL('options.html')

  return {
    url: url,
    filename: fileName,
    referrer: referrer,
    options: options,
  }
}
