/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { DownloadTweetMediaMessage } from '#libs/webExtMessage/messages/downloadTweetMedia'
import downloadMessageHandler from './downloadMediaHandler'
import type { Runtime } from 'webextension-polyfill'

describe('downloadMessageHandler — port-based invocation', () => {
  it('does not provide xTransactionIdProvider when ctx.port is set', async () => {
    const mockDownloadTweetMedia = {
      process: jest.fn().mockResolvedValue(true),
    }

    // Partially mock the use-case at module level is fragile;
    // instead we patch the infra provider's solutionProvider call path
    // by spying on the DownloadTweetMedia constructor.
    //
    // Simpler approach: mock the entire DownloadTweetMedia class.
    const originalModule = jest.requireActual(
      '../../applicationUseCases/downloadTweetMedia'
    ) as typeof import('../../applicationUseCases/downloadTweetMedia')

    jest
      .spyOn(originalModule, 'DownloadTweetMedia' as never)
      .mockImplementation((() => mockDownloadTweetMedia) as never)

    const infraProvider = {} as Parameters<typeof downloadMessageHandler>[0]

    const message = new DownloadTweetMediaMessage({
      tweetId: '123',
      screenName: 'test',
    })

    const port: Runtime.Port = {
      name: 'content-script',
      disconnect: jest.fn(),
      postMessage: jest.fn(),
      onMessage: {
        addListener: jest.fn(),
        removeListener: jest.fn(),
        hasListener: jest.fn(),
      },
      onDisconnect: {
        addListener: jest.fn(),
        removeListener: jest.fn(),
        hasListener: jest.fn(),
      },
    }

    const ctx = {
      message: message.toObject(),
      sender: {
        tab: {
          id: 1,
          url: 'https://x.com/',
          index: 0,
          highlighted: false,
          active: true,
          pinned: false,
          incognito: false,
        },
      },
      response: jest.fn(),
      port,
    }

    const handler = downloadMessageHandler(infraProvider)
    await handler(ctx)

    // Verify process was called and xTransactionIdProvider is undefined
    expect(mockDownloadTweetMedia.process).toHaveBeenCalledWith(
      expect.objectContaining({ xTransactionIdProvider: undefined })
    )
  })
})
