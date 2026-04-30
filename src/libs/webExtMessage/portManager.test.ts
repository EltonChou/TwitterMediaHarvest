/**
 * @jest-environment jsdom
 */
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { MockPort, makeMockPort } from '#mocks/port'
import { WebExtAction } from './messages/base'
import {
  CaptureResponseMessage,
  ResponseType,
} from './messages/captureResponse'
import { MessagePortName } from './port'
import { PortManager, PortPayload } from './portManager'
import { runtime } from 'webextension-polyfill'

jest.mock('webextension-polyfill', () => ({
  runtime: { connect: jest.fn() },
}))

const mockConnect = runtime.connect as jest.Mock

afterEach(() => {
  mockConnect.mockReset()
})

const makeRequest = (body: string) =>
  new CaptureResponseMessage({ type: ResponseType.TweetDetail, body })

const makeDedupable = (dedupeId: string, dedupeTtlMs?: number): PortPayload => {
  const json = { action: WebExtAction.CaptureResponse }
  return {
    dedupeId,
    dedupeTtlMs,
    toJSON: () => json,
    toObject: () => json,
  } as unknown as PortPayload
}

describe('PortManager', () => {
  it('reuses the same port across calls until disconnect', () => {
    const port = makeMockPort(MessagePortName.ContentScript)
    mockConnect.mockReturnValue(port)
    const manager = new PortManager()

    manager.postMessage(MessagePortName.ContentScript, makeRequest('a'))
    manager.postMessage(MessagePortName.ContentScript, makeRequest('b'))

    expect(mockConnect).toHaveBeenCalledTimes(1)
    expect(port.postMessage).toHaveBeenCalledTimes(2)
  })

  it('reconnects on next access after the port disconnects', () => {
    const port1 = makeMockPort(MessagePortName.ContentScript)
    const port2 = makeMockPort(MessagePortName.ContentScript)
    mockConnect.mockReturnValueOnce(port1).mockReturnValueOnce(port2)
    const manager = new PortManager()

    const first = makeRequest('first')
    const second = makeRequest('second')
    manager.postMessage(MessagePortName.ContentScript, first)
    port1.onDisconnect._trigger()
    manager.postMessage(MessagePortName.ContentScript, second)

    expect(mockConnect).toHaveBeenCalledTimes(2)
    expect(port1.postMessage).toHaveBeenCalledWith(first.toObject())
    expect(port2.postMessage).toHaveBeenCalledWith(second.toObject())
  })

  it('serializes WebExtMessage requests via toObject()', () => {
    const port = makeMockPort(MessagePortName.ContentScript)
    mockConnect.mockReturnValue(port)
    const manager = new PortManager()
    const request = makeRequest('payload')

    manager.postMessage(MessagePortName.ContentScript, request)

    expect(port.postMessage).toHaveBeenCalledWith(request.toObject())
  })

  it('posts response objects as-is', () => {
    const port = makeMockPort(MessagePortName.ContentScript)
    mockConnect.mockReturnValue(port)
    const manager = new PortManager()
    const request = makeRequest('payload')
    const response = request.makeResponse(false, 'failed')

    manager.postMessage(MessagePortName.ContentScript, response)

    expect(port.postMessage).toHaveBeenCalledWith(response)
  })

  it('re-attaches registered listeners on every reconnect', () => {
    const port1 = makeMockPort(MessagePortName.ContentScript)
    const port2 = makeMockPort(MessagePortName.ContentScript)
    mockConnect.mockReturnValueOnce(port1).mockReturnValueOnce(port2)
    const manager = new PortManager()
    const listener = jest.fn()

    manager.addMessageListener(MessagePortName.ContentScript, listener)
    manager.getPort(MessagePortName.ContentScript)
    expect(port1.onMessage.addListener).toHaveBeenCalledWith(listener)

    port1.onDisconnect._trigger()
    manager.getPort(MessagePortName.ContentScript)

    expect(port2.onMessage.addListener).toHaveBeenCalledWith(listener)
  })

  it('attaches listeners to the existing port when registered after connect', () => {
    const port: MockPort = makeMockPort(MessagePortName.ContentScript)
    mockConnect.mockReturnValue(port)
    const manager = new PortManager()

    manager.getPort(MessagePortName.ContentScript)
    const listener = jest.fn()
    manager.addMessageListener(MessagePortName.ContentScript, listener)

    expect(port.onMessage.addListener).toHaveBeenCalledWith(listener)
  })

  it('does not connect until first access', () => {
    const manager = new PortManager()
    const listener = jest.fn()

    manager.addMessageListener(MessagePortName.ContentScript, listener)

    expect(mockConnect).not.toHaveBeenCalled()
  })

  describe('dedupable messages', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('drops a duplicate dedupable message within the TTL window', () => {
      const port = makeMockPort(MessagePortName.ContentScript)
      mockConnect.mockReturnValue(port)
      const manager = new PortManager()

      manager.postMessage(MessagePortName.ContentScript, makeDedupable('k1'))
      manager.postMessage(MessagePortName.ContentScript, makeDedupable('k1'))

      expect(port.postMessage).toHaveBeenCalledTimes(1)
    })

    it('allows the same dedupeId again after the default TTL elapses', () => {
      const port = makeMockPort(MessagePortName.ContentScript)
      mockConnect.mockReturnValue(port)
      const manager = new PortManager()

      manager.postMessage(MessagePortName.ContentScript, makeDedupable('k1'))
      jest.advanceTimersByTime(2001)
      manager.postMessage(MessagePortName.ContentScript, makeDedupable('k1'))

      expect(port.postMessage).toHaveBeenCalledTimes(2)
    })

    it('honours a per-message dedupeTtlMs override', () => {
      const port = makeMockPort(MessagePortName.ContentScript)
      mockConnect.mockReturnValue(port)
      const manager = new PortManager()

      manager.postMessage(
        MessagePortName.ContentScript,
        makeDedupable('k1', 500)
      )
      jest.advanceTimersByTime(501)
      manager.postMessage(
        MessagePortName.ContentScript,
        makeDedupable('k1', 500)
      )

      expect(port.postMessage).toHaveBeenCalledTimes(2)
    })

    it('does not dedupe different dedupeIds', () => {
      const port = makeMockPort(MessagePortName.ContentScript)
      mockConnect.mockReturnValue(port)
      const manager = new PortManager()

      manager.postMessage(MessagePortName.ContentScript, makeDedupable('k1'))
      manager.postMessage(MessagePortName.ContentScript, makeDedupable('k2'))

      expect(port.postMessage).toHaveBeenCalledTimes(2)
    })

    it('does not dedupe messages without a dedupeId', () => {
      const port = makeMockPort(MessagePortName.ContentScript)
      mockConnect.mockReturnValue(port)
      const manager = new PortManager()

      manager.postMessage(MessagePortName.ContentScript, makeRequest('a'))
      manager.postMessage(MessagePortName.ContentScript, makeRequest('a'))

      expect(port.postMessage).toHaveBeenCalledTimes(2)
    })

    it('clears dedupe state on disconnect', () => {
      const port1 = makeMockPort(MessagePortName.ContentScript)
      const port2 = makeMockPort(MessagePortName.ContentScript)
      mockConnect.mockReturnValueOnce(port1).mockReturnValueOnce(port2)
      const manager = new PortManager()

      manager.postMessage(MessagePortName.ContentScript, makeDedupable('k1'))
      port1.onDisconnect._trigger()
      manager.postMessage(MessagePortName.ContentScript, makeDedupable('k1'))

      expect(port1.postMessage).toHaveBeenCalledTimes(1)
      expect(port2.postMessage).toHaveBeenCalledTimes(1)
    })
  })
})
