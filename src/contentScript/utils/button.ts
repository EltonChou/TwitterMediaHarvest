/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import {
  CheckDownloadHistoryMessage,
  DownloadTweetMediaMessage,
  sendMessage,
} from '#libs/webExtMessage'
import { getTweetInfoFromArticleChildElement } from './article'

type ButtonElement = HTMLElement

export const enum ButtonStatus {
  Downloading = 'downloading',
  Success = 'success',
  Error = 'error',
  Downloaded = 'downloaded',
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

const setButtonStatus = (status: ButtonStatus) => (button: ButtonElement) => {
  cleanButtonStatus(button)
  button.classList.add(status)
  return button
}

const isDownloadingButton = (button: ButtonElement) =>
  button.classList.contains('downloading')

const responseStatusToButtonStatus = (respStatus: 'ok' | 'error') =>
  respStatus === 'ok' ? ButtonStatus.Success : ButtonStatus.Error

const buttonClickHandler = (e: MouseEvent) => {
  e.stopImmediatePropagation()
  const target = e.target
  if (!(target instanceof Element)) return

  const button = target.closest<HTMLElement>('.harvester')
  if (!button) return
  if (isDownloadingButton(button)) return

  setButtonStatus(ButtonStatus.Downloading)(button)
  const { value, error } = getTweetInfoFromArticleChildElement(button)
  if (error) {
    // eslint-disable-next-line no-console
    console.error(error)
    return setButtonStatus(ButtonStatus.Error)(button)
  }
  const message = new DownloadTweetMediaMessage(value.mapBy(props => props))
  sendMessage(message).then(resp =>
    setButtonStatus(responseStatusToButtonStatus(resp.status))(button)
  )
}

export const makeButtonListener = <T extends ButtonElement>(button: T): T => {
  button.addEventListener('click', buttonClickHandler)
  return button
}

export const checkButtonStatus = <T extends ButtonElement>(button: T): T => {
  const { value, error } = getTweetInfoFromArticleChildElement(button)
  if (error) return button

  const message = new CheckDownloadHistoryMessage({ tweetId: value.tweetId })
  sendMessage(message).then(resp => {
    if (resp.status === 'error') return button
    if (isDownloadingButton(button)) return button
    if (resp.payload.isExist)
      return setButtonStatus(ButtonStatus.Downloaded)(button)
    if (!resp.payload.isExist) return cleanButtonStatus(button)
    return button
  })

  return button
}
