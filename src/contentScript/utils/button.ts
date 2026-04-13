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

export const { registerButton, getButtons, getButtonRegistry } = (() => {
  const registry = new Map<string, Set<ButtonElement>>()
  return {
    registerButton(tweetId: string, button: ButtonElement): void {
      let buttons = registry.get(tweetId)
      if (!buttons) {
        buttons = new Set()
        registry.set(tweetId, buttons)
      }
      buttons.add(button)
    },
    getButtons(tweetId: string): ReadonlySet<ButtonElement> {
      return registry.get(tweetId) ?? new Set()
    },
    getButtonRegistry(): ReadonlyMap<string, ReadonlySet<ButtonElement>> {
      return registry
    },
  }
})()

const buttonClickHandler = (e: MouseEvent) => {
  e.stopImmediatePropagation()
  const target = e.target
  if (!(target instanceof Element)) return

  const button = target.closest<HTMLElement>('.harvester')
  if (!button || isDownloadingButton(button)) return

  setButtonStatus(ButtonStatus.Downloading)(button)
  const { value: tweetInfo, error } =
    getTweetInfoFromArticleChildElement(button)
  if (error) {
    // eslint-disable-next-line no-console
    console.error(error)
    return setButtonStatus(ButtonStatus.Error)(button)
  }
  sendMessage(new DownloadTweetMediaMessage(tweetInfo.mapBy(props => props)))
}

export const initButtonListeners = (): void => {
  document.addEventListener('mh:download:has-downloaded', ev => {
    const { tweetId } = ev.detail
    for (const button of getButtons(tweetId)) {
      if (isDownloadingButton(button))
        setButtonStatus(ButtonStatus.Success)(button)
      else setButtonStatus(ButtonStatus.Downloaded)(button)
    }
  })

  document.addEventListener('mh:download:is-failed', ev => {
    const { tweetId } = ev.detail
    for (const button of getButtons(tweetId)) {
      setButtonStatus(ButtonStatus.Error)(button)
    }
  })
}

export const makeButtonListener = <T extends ButtonElement>(button: T): T => {
  button.addEventListener('click', buttonClickHandler)
  return button
}

export const checkButtonStatus = <T extends ButtonElement>(button: T): T => {
  const { value: tweetInfo, error } =
    getTweetInfoFromArticleChildElement(button)
  if (error) return button

  registerButton(tweetInfo.tweetId, button)
  sendMessage(new CheckDownloadHistoryMessage({ tweetId: tweetInfo.tweetId }))

  return button
}
