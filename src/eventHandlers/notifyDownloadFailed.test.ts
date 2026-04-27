// SPDX-License-Identifier: MPL-2.0
import DownloadFailed from '#domain/events/DownloadFailed'
import { DownloadConfig } from '#domain/valueObjects/downloadConfig'
import { TweetInfo } from '#domain/valueObjects/tweetInfo'
import ConflictAction from '#enums/ConflictAction'
import { getNotifier } from '#infra/browserNotifier'
import { MockEventPublisher } from '#mocks/eventPublisher'
import { notifyDownloadFailed } from './notifyDownloadFailed'
import { i18n } from 'webextension-polyfill'

afterEach(() => jest.resetAllMocks())

describe('unit test for notify download failed handler', () => {
  const publisher = new MockEventPublisher()

  const makeEvent = () =>
    new DownloadFailed({
      downloadId: 1,
      reason: 'NETWORK_FAILED',
      tweetInfo: new TweetInfo({ screenName: 'name', tweetId: 'tweetId' }),
      downloadConfig: new DownloadConfig({
        conflictAction: ConflictAction.Overwrite,
        filename: '/usr/local/downloads/expect.jpg',
        saveAs: true,
        url: 'url',
      }),
    })

  it('emits notification using the event payload', async () => {
    const notifier = getNotifier()
    jest.spyOn(i18n, 'getMessage').mockImplementation(msg => msg)
    const mockNotify = jest.spyOn(notifier, 'notify')

    const handle = notifyDownloadFailed(notifier)
    await handle(makeEvent(), publisher)

    expect(mockNotify).toHaveBeenCalled()
    expect(mockNotify.mock.calls[0][0]).toBe('download_1')
  })
})
