// SPDX-License-Identifier: MPL-2.0
import DownloadFailed from '#domain/events/DownloadFailed'
import { DownloadConfig } from '#domain/valueObjects/downloadConfig'
import { TweetInfo } from '#domain/valueObjects/tweetInfo'
import ConflictAction from '#enums/ConflictAction'
import { WebExtAction } from '#libs/webExtMessage'
import { MockEventPublisher } from '#mocks/eventPublisher'
import { broadcastDownloadFailed } from './broadcastDownloadFailed'

afterEach(() => jest.resetAllMocks())

describe('unit test for broadcast download failed handler', () => {
  const publisher = new MockEventPublisher()

  const makeEvent = (reason: Error | string = 'NETWORK_FAILED') =>
    new DownloadFailed({
      downloadId: 1,
      reason,
      tweetInfo: new TweetInfo({ screenName: 'name', tweetId: 'tweetId' }),
      downloadConfig: new DownloadConfig({
        conflictAction: ConflictAction.Overwrite,
        filename: '/usr/local/downloads/expect.jpg',
        saveAs: true,
        url: 'url',
      }),
    })

  it('broadcasts a download failed response built from the event', async () => {
    const broadcast = jest.fn()

    const handle = broadcastDownloadFailed(broadcast)
    await handle(makeEvent(), publisher)

    expect(broadcast).toHaveBeenCalledWith({
      isResponse: true,
      action: WebExtAction.DownloadMedia,
      status: 'error',
      reason: 'NETWORK_FAILED',
      tweetId: 'tweetId',
    })
  })

  // Contract: this handler does not filter by reason. Reason filtering lives in
  // `publishDownloadFailed` so the `download:status:failed` event itself is
  // already gated. Any event that reaches this handler must produce a broadcast.
  it.each([
    'USER_CANCELED',
    'USER_SHUTDOWN',
    'NETWORK_FAILED',
    'FILE_NO_SPACE',
  ])('broadcasts unconditionally for reason %s', async reason => {
    const broadcast = jest.fn()

    const handle = broadcastDownloadFailed(broadcast)
    await handle(makeEvent(reason), publisher)

    expect(broadcast).toHaveBeenCalledTimes(1)
  })

  it('coerces Error reason to its message', async () => {
    const broadcast = jest.fn()

    const handle = broadcastDownloadFailed(broadcast)
    await handle(makeEvent(new Error('boom')), publisher)

    expect(broadcast).toHaveBeenCalledWith(
      expect.objectContaining({ reason: 'boom' })
    )
  })
})
