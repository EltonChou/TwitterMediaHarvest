import {
  CheckDownloadHistoryMessage,
  DownloadTweetMediaMessage,
  sendMessage,
} from '#libs/webExtMessage'
import { getTweetInfoFromArticleChiledElement } from './article'

export const enum ButtonStatus {
  Downloading = 'downloading',
  Success = 'success',
  Error = 'error',
  Downloaded = 'downloaded',
}

/**
 * Create HTMLElement from html string.
 *
 * @param htmlString A valid html string.
 */
export const createElementFromHTML = (htmlString: string): HTMLElement => {
  const wrapper = document.createElement('div')
  wrapper.innerHTML = htmlString.trim()
  return wrapper.firstElementChild as HTMLElement
}

const cleanButtonStatus = (button: HTMLElement) => {
  button.classList.remove(
    ButtonStatus.Downloading,
    ButtonStatus.Success,
    ButtonStatus.Error,
    ButtonStatus.Downloaded
  )
  return button
}

const setButtonStatus = (status: ButtonStatus) => (button: HTMLElement) => {
  cleanButtonStatus(button)
  button.classList.add(status)
  return button
}

const isButtonDownloading = (button: HTMLElement) =>
  button.classList.contains('downloading')

const responseStatusToButtonStatus = (respStatus: 'ok' | 'error') =>
  respStatus === 'ok' ? ButtonStatus.Success : ButtonStatus.Error

const buttonClickHandler = (e: MouseEvent) => {
  e.stopImmediatePropagation()
  const target = e.target
  if (!(target instanceof HTMLElement)) return
  if (!target || isButtonDownloading(target)) return

  setButtonStatus(ButtonStatus.Downloading)(target)
  const { value, error } = getTweetInfoFromArticleChiledElement(target)
  if (error) return setButtonStatus(ButtonStatus.Error)(target)
  const message = new DownloadTweetMediaMessage(value.mapBy(props => props))
  sendMessage(message).then(resp =>
    setButtonStatus(responseStatusToButtonStatus(resp.status))(target)
  )
}

export const makeButtonListener = <T extends HTMLElement>(button: T): T => {
  button.addEventListener('click', buttonClickHandler)

  const { value, error } = getTweetInfoFromArticleChiledElement(button)
  if (error) return button

  const message = new CheckDownloadHistoryMessage({ tweetId: value.tweetId })
  sendMessage(message).then(resp => {
    if (resp.payload.isExist) setButtonStatus(ButtonStatus.Downloaded)(button)
  })

  return button
}
