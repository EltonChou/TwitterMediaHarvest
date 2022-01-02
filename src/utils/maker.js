import { ACTION } from '../constants'

/**
 * @typedef {Object} tweetInfo
 * @property {string} screenName
 * @property {string} tweetId
 */
/**
 * Create HTMLElement from html string.
 *
 * @param {InnerHTML} htmlString A valid html.
 * @returns {HTMLElement}
 */
export const createElementFromHTML = htmlString => {
  const wrapper = document.createElement('div')
  wrapper.innerHTML = htmlString.trim()
  return wrapper.firstChild
}

/**
 *
 * @param {HTMLElement} button
 * @param {tweetInfo} data
 *
 * @returns {HTMLElement}
 */
export const makeButtonWithData = (button, data) => {
  Object.assign(button.dataset, data)
  return button
}

/**
 *
 * @param {HTMLElement} button harvestButton
 *
 * @returns {HTMLElement} button
 */
export const makeButtonListener = button => {
  button.addEventListener('click', function (e) {
    e.stopImmediatePropagation()
    chrome.runtime.sendMessage({
      action: ACTION.download,
      data: this.dataset,
    })
  })
}

/**
 * @typedef {Object} browserDownloadConfig
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
 * @param {String} referer
 *
 * @returns {browserDownloadConfig}
 */
export const makeBrowserDownloadConfig = (url, fileName) => {
  return {
    url: url,
    filename: fileName,
    conflictAction: 'overwrite',
    saveAs: false,
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
  referrer,
  options = {}
) => {
  return {
    url: url,
    filename: fileName,
    referrer: referrer,
    options: options,
  }
}
