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
export const makeButtonWithData = (
  button: HTMLElement,
  data: TweetInfo
): HTMLElement => {
  Object.assign(button.dataset, data)
  return button
}


const runtimeSendMessage = (
  message: HarvestMessage,
  responseCb: (response: { status: string, data: object }) => void) => {
  chrome.runtime.sendMessage(message, responseCb)
}

/**
 * @param button harvestButton
 */
export const makeButtonListener = <T extends HTMLElement = HTMLElement>(
  button: T, infoParser: (article: HTMLElement) => TweetInfo
): T => {
  button.addEventListener('click', async function (e) {
    const article: HTMLElement = this.closest('[data-harvest-article]')
    if (!article) return false
    const tweetInfo: TweetInfo = infoParser(article)

    e.stopImmediatePropagation()
    if (this.classList.contains('downloading')) return false
    this.classList.remove('success', 'error')
    this.classList.add('downloading')
    const message: HarvestMessage = {
      action: Action.Download,
      data: tweetInfo
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const reponseCb = (response: any) => {
      const { status } = response
      this.classList.remove('downloading', 'success', 'error')
      this.classList.add(status)
    }

    runtimeSendMessage(message, reponseCb)
  })
  return button
}