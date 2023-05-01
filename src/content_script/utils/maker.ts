import { captureException } from '@sentry/browser'
import browser from 'webextension-polyfill'
import { Action } from '../../typings'

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
export const makeButtonWithData = (button: HTMLElement, data: TweetInfo): HTMLElement => {
  Object.assign(button.dataset, data)
  return button
}

/**
 * @param button harvestButton
 */
export const makeButtonListener = <T extends HTMLElement = HTMLElement>(
  button: T,
  infoParser: (article: HTMLElement) => TweetInfo
): T => {
  button.addEventListener('click', async function (e) {
    e.stopImmediatePropagation()
    const article: HTMLElement = this.closest('[data-harvest-article]')

    if (this.classList.contains('downloading') || !article) return
    this.classList.remove('success', 'error')
    this.classList.add('downloading')

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    try {
      const tweetInfo: TweetInfo = infoParser(article)
      const message: HarvestMessage = {
        action: Action.Download,
        data: tweetInfo,
      }
      console.log('Send message to service worker.', message)
      const resp = await browser.runtime.sendMessage(message)
      const { status } = resp
      this.classList.remove('downloading', 'success', 'error')
      this.classList.add(status)
    } catch (error) {
      captureException(error)
      console.error(error)
    }
  })

  return button
}
