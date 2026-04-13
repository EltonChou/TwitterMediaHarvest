/**
 * @jest-environment jsdom
 */
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { contentScriptBus } from '#libs/contentScriptBus'
import { sendMessage } from '#libs/webExtMessage'
import { toErrorResult, toSuccessResult } from '#utils/result'
import { generateTweetInfo } from '#utils/test/tweetInfo'
import { getTweetInfoFromArticleChildElement } from './article'
import {
  ButtonStatus,
  checkButtonStatus,
  getButtonRegistry,
  initButtonListeners,
  makeButtonListener,
  registerButton,
} from './button'

jest.mock('./article', () => ({
  getTweetInfoFromArticleChildElement: jest.fn(),
}))

jest.mock('#libs/webExtMessage', () => ({
  sendMessage: jest.fn(),
  CheckDownloadHistoryMessage: jest.fn().mockImplementation(p => p),
  DownloadTweetMediaMessage: jest.fn().mockImplementation(p => ({
    ...p,
    mapBy: jest.fn().mockReturnValue(p),
  })),
}))

const mockGetTweetInfo = jest.mocked(getTweetInfoFromArticleChildElement)
const mockSendMessage = jest.mocked(sendMessage)

const makeButton = (...classes: string[]): HTMLElement => {
  const el = document.createElement('div')
  el.classList.add('harvester', ...classes)
  document.body.appendChild(el)
  return el
}

beforeEach(() => {
  jest.clearAllMocks()
  document.body.innerHTML = ''
})

// ─── registry ────────────────────────────────────────────────────────────────

describe('registerButton / getButtonRegistry', () => {
  it('adds button to the registry under the correct tweetId', () => {
    const button = makeButton()
    registerButton('tweet-1', button)
    expect(getButtonRegistry().get('tweet-1')).toContain(button)
  })

  it('accumulates multiple buttons for the same tweetId', () => {
    const b1 = makeButton()
    const b2 = makeButton()
    registerButton('tweet-2', b1)
    registerButton('tweet-2', b2)
    const set = getButtonRegistry().get('tweet-2')!
    expect(set.size).toBe(2)
    expect(set).toContain(b1)
    expect(set).toContain(b2)
  })

  it('returns the live registry map', () => {
    const button = makeButton()
    const registry = getButtonRegistry()
    registerButton('tweet-3', button)
    expect(registry.get('tweet-3')).toContain(button)
  })
})

// ─── checkButtonStatus ───────────────────────────────────────────────────────

describe('checkButtonStatus', () => {
  it('returns the button unchanged and does not send a message when tweet info parse fails', () => {
    const button = makeButton()
    mockGetTweetInfo.mockReturnValue(toErrorResult(new Error('parse error')))

    const result = checkButtonStatus(button)

    expect(result).toBe(button)
    expect(mockSendMessage).not.toHaveBeenCalled()
  })

  it('registers the button and sends CheckDownloadHistoryMessage when tweet info is valid', () => {
    const tweetInfo = generateTweetInfo()
    const button = makeButton()
    mockGetTweetInfo.mockReturnValue(toSuccessResult(tweetInfo))

    checkButtonStatus(button)

    expect(getButtonRegistry().get(tweetInfo.tweetId)).toContain(button)
    expect(mockSendMessage).toHaveBeenCalledTimes(1)
  })
})

// ─── initButtonListeners ─────────────────────────────────────────────────────

describe('initButtonListeners', () => {
  beforeAll(() => {
    initButtonListeners()
  })

  const dispatchDownloadEvent = (
    eventName: 'mh:download:has-downloaded' | 'mh:download:is-failed',
    tweetId: string
  ) =>
    contentScriptBus.dispatchEvent(
      new CustomEvent(eventName, { detail: { tweetId } })
    )

  describe('mh:download:has-downloaded', () => {
    it('sets Downloaded status on a non-downloading button', () => {
      const tweetId = 'tweet-dl-1'
      const button = makeButton()
      registerButton(tweetId, button)

      dispatchDownloadEvent('mh:download:has-downloaded', tweetId)

      expect(button.classList).toContain(ButtonStatus.Downloaded)
    })

    it('sets Success status on a downloading button', () => {
      const tweetId = 'tweet-dl-2'
      const button = makeButton(ButtonStatus.Downloading)
      registerButton(tweetId, button)

      dispatchDownloadEvent('mh:download:has-downloaded', tweetId)

      expect(button.classList).toContain(ButtonStatus.Success)
      expect(button.classList).not.toContain(ButtonStatus.Downloading)
    })

    it('does not throw for an unknown tweetId', () => {
      expect(() =>
        dispatchDownloadEvent('mh:download:has-downloaded', 'unknown-id')
      ).not.toThrow()
    })
  })

  describe('mh:download:is-failed', () => {
    it('sets Error status on the button', () => {
      const tweetId = 'tweet-fail-1'
      const button = makeButton()
      registerButton(tweetId, button)

      dispatchDownloadEvent('mh:download:is-failed', tweetId)

      expect(button.classList).toContain(ButtonStatus.Error)
    })
  })
})

// ─── makeButtonListener / click handler ──────────────────────────────────────

describe('makeButtonListener / buttonClickHandler', () => {
  const clickButton = (button: HTMLElement) =>
    button.dispatchEvent(new MouseEvent('click', { bubbles: true }))

  it('returns the same button element', () => {
    const button = makeButton()
    expect(makeButtonListener(button)).toBe(button)
  })

  it('does not send a message when the button is already downloading', () => {
    const button = makeButton(ButtonStatus.Downloading)
    makeButtonListener(button)

    clickButton(button)

    expect(mockSendMessage).not.toHaveBeenCalled()
  })

  it('sets Error status and does not send a message when tweet info parse fails', () => {
    mockGetTweetInfo.mockReturnValue(toErrorResult(new Error('parse error')))
    const button = makeButton()
    makeButtonListener(button)

    clickButton(button)

    expect(button.classList).toContain(ButtonStatus.Error)
    expect(mockSendMessage).not.toHaveBeenCalled()
  })

  it('sets Downloading status and sends DownloadTweetMediaMessage on a valid click', () => {
    const tweetInfo = generateTweetInfo()
    mockGetTweetInfo.mockReturnValue(toSuccessResult(tweetInfo))
    const button = makeButton()
    makeButtonListener(button)

    clickButton(button)

    expect(button.classList).toContain(ButtonStatus.Downloading)
    expect(mockSendMessage).toHaveBeenCalledTimes(1)
  })
})
