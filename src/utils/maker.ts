import { ACTION } from '../constants'
import { Aria2DownloadOption, DownloadRecordId, TweetInfo } from '../typings'

/**
 * Create HTMLElement from html string.
 *
 * @param htmlString A valid html string.
 */
export const createElementFromHTML = (htmlString: string): Element => {
  const wrapper = document.createElement('div')
  wrapper.innerHTML = htmlString.trim()
  return wrapper.firstElementChild
}

/**
 * @param button
 * @param data
 */
export const makeButtonWithData = (
  button: HTMLElement,
  data: TweetInfo
): HTMLElement => {
  Object.assign(button.dataset, data)
  return button
}

/**
 * @param button harvestButton
 */
export const makeButtonListener = <T extends HTMLElement = HTMLElement>(
  button: T
): T => {
  button.addEventListener('click', async function (e) {
    if (this.classList.contains('downloading')) return false
    this.classList.remove('success', 'error')
    e.stopImmediatePropagation()
    this.classList.add('downloading')
    chrome.runtime.sendMessage(
      {
        action: ACTION.download,
        data: this.dataset,
      },
      response => {
        const { status } = response
        this.classList.remove('downloading', 'success', 'error')
        this.classList.add(status)
      }
    )
  })
  return button
}

/**
 * Create browser download config object.
 *
 * @param url
 * @param fileName
 * @param referer
 */
export const makeBrowserDownloadConfig = (
  url: string,
  fileName: string
): chrome.downloads.DownloadOptions => {
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
 * @param url
 * @param fileName
 * @param referrer
 * @param options aria2 options
 */
export const makeAria2DownloadConfig = (
  url: string,
  fileName: string,
  referrer: string,
  options: object = {}
): Aria2DownloadOption => {
  return {
    url: url,
    filename: fileName,
    referrer: referrer,
    options: options,
  }
}

export const makeDownloadRecordId = (downloadId: number): DownloadRecordId =>
  `dl_${downloadId}`
