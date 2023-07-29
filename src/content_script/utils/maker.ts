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

const sendDownloadExchange = async (button: HTMLElement, process: () => Promise<ButtonStatus>) => {
  setButtonStatus(button, 'downloading')
  try {
    const status = await process()
    setButtonStatus(button, status)
  } catch (error) {
    setButtonStatus(button, 'error')
    captureException(error)
    console.error(error)
  }
}

/**
 * @param button harvestButton
 */
export const makeButtonListener = <T extends HTMLElement = HTMLElement>(
  button: T,
  infoProvider: Provider<TweetInfo>
): T => {
  button.addEventListener('click', async function (e) {
    e.stopImmediatePropagation()
    if (isButtonDownloading(this)) return

    await sendDownloadExchange(button, async () => {
      const tweetInfo = await infoProvider()
      const exchange: Parameters<typeof exchangeInternal>[0] = {
        action: Action.Download,
        data: tweetInfo,
      }

      console.log('Send message to service worker.', exchange)
      const resp = await exchangeInternal(exchange)
      return resp.status
    })
  })

  return button
}
