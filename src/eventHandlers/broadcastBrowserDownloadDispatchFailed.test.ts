// SPDX-License-Identifier: MPL-2.0
import BrowserDownloadDispatchFailed from '#domain/events/BrowserDownloadDispatchFailed'
import { TweetInfo } from '#domain/valueObjects/tweetInfo'
import { WebExtAction } from '#libs/webExtMessage'
import { MockEventPublisher } from '#mocks/eventPublisher'
import { broadcastBrowserDownloadDispatchFailed } from './broadcastBrowserDownloadDispatchFailed'

afterEach(() => jest.resetAllMocks())

describe('unit test for broadcast browser download dispatch failed handler', () => {
  const publisher = new MockEventPublisher()

  const makeEvent = (reason: Error | string = 'Failed to download') =>
    new BrowserDownloadDispatchFailed({
      reason,
      tweetInfo: new TweetInfo({ screenName: 'name', tweetId: 'tweetId' }),
    })

  it('broadcasts a download failed response built from the event', async () => {
    const broadcast = jest.fn()

    const handle = broadcastBrowserDownloadDispatchFailed(broadcast)
    await handle(makeEvent(), publisher)

    expect(broadcast).toHaveBeenCalledWith({
      isResponse: true,
      action: WebExtAction.DownloadMedia,
      status: 'error',
      reason: 'Failed to download',
      tweetId: 'tweetId',
    })
  })

  it('coerces Error reason to its message', async () => {
    const broadcast = jest.fn()

    const handle = broadcastBrowserDownloadDispatchFailed(broadcast)
    await handle(makeEvent(new Error('boom')), publisher)

    expect(broadcast).toHaveBeenCalledWith(
      expect.objectContaining({ reason: 'boom' })
    )
  })
})
