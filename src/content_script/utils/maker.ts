import { Action } from '../../typings'
import * as Sentry from '@sentry/browser'

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


/* eslint-disable no-console */
const runtimeSendMessage = (
  message: HarvestMessage,
  responseCb: (response: { status: string, data: object }) => void) => {
  console.log('Send message to service worker.', message)
  chrome.runtime.sendMessage(message, responseCb)
}

/* eslint-disable no-console */

/**
 * @param button harvestButton
 */
export const makeButtonListener = <T extends HTMLElement = HTMLElement>(
  button: T, infoParser: (article: HTMLElement) => TweetInfo
): T => {
  button.addEventListener('click', async function (e) {
    const article: HTMLElement = this.closest('[data-harvest-article]')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const reponseCb = (response: any) => {
      const { status } = response
      this.classList.remove('downloading', 'success', 'error')
      this.classList.add(status)

      chrome.runtime.sendMessage({
        action: Action.Refresh,
      })
    }
    if (!article) return false

    e.stopImmediatePropagation()
    if (this.classList.contains('downloading')) return false
    this.classList.remove('success', 'error')
    this.classList.add('downloading')

    try {
      const tweetInfo: TweetInfo = infoParser(article)
      const message: HarvestMessage = {
        action: Action.Download,
        data: tweetInfo
      }

      runtimeSendMessage(message, reponseCb)
    } catch (error) {
      Sentry.captureException(error)
      console.error(error)
    }
  })

  return button
}