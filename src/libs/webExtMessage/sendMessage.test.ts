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
import type { Runtime } from 'webextension-polyfill'

jest.mock('./port', () => {
  const listeners: ((msg: unknown) => void)[] = []
  const mockPort = {
    postMessage: jest.fn(),
    onMessage: {
      addListener: (fn: (msg: unknown) => void) => listeners.push(fn),
      removeListener: (fn: (msg: unknown) => void) => {
        const idx = listeners.indexOf(fn)
        if (idx !== -1) listeners.splice(idx, 1)
      },
      hasListener: jest.fn(),
      _triggerMessage: (msg: unknown) => listeners.forEach(l => l(msg)),
    },
    onDisconnect: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
      hasListener: jest.fn(),
    },
    _listeners: listeners,
  } as unknown as Runtime.Port & {
    onMessage: { _triggerMessage: (msg: unknown) => void }
    _listeners: ((msg: unknown) => void)[]
  }

  return {
    MessagePortName: { ContentScript: 'content-script' },
    getMessagePort: jest.fn().mockReturnValue(mockPort),
    isOneShotMessage: jest.requireActual('./port').isOneShotMessage,
    _mockPort: mockPort,
  }
})

const mockPort = (
  portModule as unknown as {
    _mockPort: Runtime.Port & {
      postMessage: jest.Mock
      onMessage: { _triggerMessage: (msg: unknown) => void }
      _listeners: ((msg: unknown) => void)[]
    }
  }
)._mockPort

describe('sendMessage()', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockPort._listeners.length = 0
  })

  it('fire-and-forget: calls port.postMessage and resolves void', async () => {
    const message = new CaptureResponseMessage({
      type: ResponseType.TweetDetail,
      body: 'test',
    })

    const result = await sendMessage(message)

    expect(mockPort.postMessage).toHaveBeenCalledWith(message.toObject())
    expect(result).toBeUndefined()
  })

  it('one-shot: resolves on correlationId match', async () => {
    const message = new CaptureResponseMessage({
      type: ResponseType.TweetDetail,
      body: 'test',
    })
    const oneShot = message.asOneShot()
    const expectedResult = { status: 'ok' }

    const promise = sendMessage(oneShot)

    // Simulate background responding with matching correlationId
    mockPort.onMessage._triggerMessage({
      correlationId: oneShot.correlationId,
      result: expectedResult,
    })

    const result = await promise
    expect(result).toEqual(expectedResult)
    expect(mockPort.postMessage).toHaveBeenCalledWith(message.toObject())
  })

  it('one-shot: ignores mismatched correlationId', async () => {
    const message = new CaptureResponseMessage({
      type: ResponseType.TweetDetail,
      body: 'test',
    })
    const oneShot = message.asOneShot()
    const expectedResult = { status: 'ok' }

    const promise = sendMessage(oneShot)

    // Trigger with wrong correlationId — should not resolve yet
    mockPort.onMessage._triggerMessage({
      correlationId: 'wrong-id',
      result: { status: 'error' },
    })

    // Trigger with correct correlationId
    mockPort.onMessage._triggerMessage({
      correlationId: oneShot.correlationId,
      result: expectedResult,
    })

    const result = await promise
    expect(result).toEqual(expectedResult)
  })
})
