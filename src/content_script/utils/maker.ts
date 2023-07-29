import { Action, exchangeInternal } from '@libs/browser'
import { captureException } from '@sentry/browser'

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

const setButtonStatus = (button: HTMLElement, status: ButtonStatus) => {
  if (!button) return button
  button.classList.remove('downloading', 'success', 'error')
  button.classList.add(status)
  return button
}

const isButtonDownloading = (button: HTMLElement) => button.classList.contains('downloading')

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

    if (isButtonDownloading(this) || !article) return
    setButtonStatus(this, 'downloading')

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    try {
      const tweetInfo = infoParser(article)
      const exchange: Parameters<typeof exchangeInternal>[0] = {
        action: Action.Download,
        data: tweetInfo,
      }
      console.log('Send message to service worker.', exchange)
      const resp = await exchangeInternal(exchange)
      setButtonStatus(this, resp.status)
      console.log(JSON.stringify(resp))
    } catch (error) {
      captureException(error)
      console.error(error)
    }
  })

  return button
}
