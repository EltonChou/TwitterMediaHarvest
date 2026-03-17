/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import {
  CaptureResponseMessage,
  ResponseType,
} from './messages/captureResponse'
import * as portModule from './port'
import { sendMessage } from './sendMessage'
import { runtime } from 'webextension-polyfill'
import type { Runtime } from 'webextension-polyfill'

jest.mock('webextension-polyfill', () => ({
  runtime: { sendMessage: jest.fn() },
  tabs: {},
}))

jest.mock('./port', () => {
  const mockPort = {
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
    _mockPort: undefined as unknown,
  } as unknown as Runtime.Port & { postMessage: jest.Mock }

  return {
    MessagePortName: { ContentScript: 'content-script' },
    getMessagePort: jest.fn().mockReturnValue(mockPort),
    isOneShotMessage: jest.requireActual('./port').isOneShotMessage,
    _mockPort: mockPort,
  }
})

const mockPort = (
  portModule as unknown as {
    _mockPort: Runtime.Port & { postMessage: jest.Mock }
  }
)._mockPort

describe('sendMessage()', () => {
  beforeEach(() => jest.clearAllMocks())

  it('fire-and-forget: calls port.postMessage and resolves void', async () => {
    const message = new CaptureResponseMessage({
      type: ResponseType.TweetDetail,
      body: 'test',
    })

    const result = await sendMessage(message)

    expect(mockPort.postMessage).toHaveBeenCalledWith(message.toObject())
    expect(result).toBeUndefined()
  })

  it('one-shot: calls runtime.sendMessage with inner message object', async () => {
    const message = new CaptureResponseMessage({
      type: ResponseType.TweetDetail,
      body: 'test',
    })
    const oneShot = message.asOneShot()
    const expectedResult = { status: 'ok' }
    jest.mocked(runtime.sendMessage).mockResolvedValue(expectedResult)

    const result = await sendMessage(oneShot)

    expect(runtime.sendMessage).toHaveBeenCalledWith(message.toObject())
    expect(result).toEqual(expectedResult)
    expect(mockPort.postMessage).not.toHaveBeenCalled()
  })
})
