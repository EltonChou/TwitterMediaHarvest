import { Action, DownloadRecordId, TweetInfo } from '../typings'

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
    e.stopImmediatePropagation()
    if (this.classList.contains('downloading')) return false
    this.classList.remove('success', 'error')
    this.classList.add('downloading')
    chrome.runtime.sendMessage(
      {
        action: Action.Download,
        data: this.dataset,
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (response: any) => {
        const { status } = response
        this.classList.remove('downloading', 'success', 'error')
        this.classList.add(status)
      }
    )
  })
  return button
}



export const makeDownloadRecordId = (downloadId: number): DownloadRecordId =>
  `dl_${downloadId}`
