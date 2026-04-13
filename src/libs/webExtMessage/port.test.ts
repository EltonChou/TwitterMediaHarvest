/**
 * @jest-environment jsdom
 */
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { WebExtAction } from './messages/base'
import { MessagePortName, getMessagePort } from './port'
import type { Runtime } from 'webextension-polyfill'
import { runtime } from 'webextension-polyfill'

jest.mock('webextension-polyfill', () => ({
  runtime: {
    connect: jest.fn(),
  },
}))

const mockConnect = runtime.connect as jest.Mock

const makePort = (): Runtime.Port & {
  onDisconnect: { _trigger: () => void }
  onMessage: { _trigger: (msg: unknown) => void }
} => {
  const disconnectListeners: (() => void)[] = []
  const messageListeners: ((msg: unknown) => void)[] = []
  return {
    name: 'content-script',
    disconnect: jest.fn(),
    postMessage: jest.fn(),
    onMessage: {
      addListener: (fn: (msg: unknown) => void) => messageListeners.push(fn),
      removeListener: jest.fn(),
      hasListener: jest.fn(),
      _trigger: (msg: unknown) => messageListeners.forEach(l => l(msg)),
    },
    onDisconnect: {
      addListener: (listener: () => void) => disconnectListeners.push(listener),
      removeListener: jest.fn(),
      hasListener: jest.fn(),
      _trigger: () => disconnectListeners.forEach(l => l()),
    },
  } as unknown as Runtime.Port & {
    onDisconnect: { _trigger: () => void }
    onMessage: { _trigger: (msg: unknown) => void }
  }
}

type MockPort = ReturnType<typeof makePort>

// Helper to trigger disconnect on the currently cached port (resetting singleton state)
const triggerDisconnectOnCached = () => {
  const { port } = getMessagePort(MessagePortName.ContentScript)
  ;(port as unknown as MockPort).onDisconnect._trigger()
}

describe('getMessagePort()', () => {
  afterEach(() => {
    mockConnect.mockReset()
    // Clean up singleton state
    triggerDisconnectOnCached()
  })

  it('reuses the same port on repeated calls for the same name', () => {
    const port = makePort()
    mockConnect.mockReturnValue(port)

    const h1 = getMessagePort(MessagePortName.ContentScript)
    const h2 = getMessagePort(MessagePortName.ContentScript)

    expect(h1).toBe(h2)
    expect(mockConnect).toHaveBeenCalledTimes(1)
  })

  it('clear() disconnects the port and removes it from cache', () => {
    const port = makePort()
    mockConnect.mockReturnValueOnce(port).mockReturnValueOnce(makePort())

    const h1 = getMessagePort(MessagePortName.ContentScript)
    h1.clear()

    expect(port.disconnect).toHaveBeenCalledTimes(1)
    // After clear, a new handle is created
    const h2 = getMessagePort(MessagePortName.ContentScript)
    expect(h2).not.toBe(h1)
    expect(mockConnect).toHaveBeenCalledTimes(2)
  })

  it('re-creates the port after disconnect', () => {
    const port1 = makePort()
    const port2 = makePort()
    mockConnect.mockReturnValueOnce(port1).mockReturnValueOnce(port2)

    const h1 = getMessagePort(MessagePortName.ContentScript)
    port1.onDisconnect._trigger()

    const h2 = getMessagePort(MessagePortName.ContentScript)

    expect(h1.port).toBe(port1)
    expect(h2.port).toBe(port2)
    expect(mockConnect).toHaveBeenCalledTimes(2)
  })
})

describe('port onMessage → document events', () => {
  let port: MockPort

  beforeEach(() => {
    port = makePort()
    mockConnect.mockReturnValue(port)
    getMessagePort(MessagePortName.ContentScript)
  })

  afterEach(() => {
    mockConnect.mockReset()
    port.onDisconnect._trigger()
  })

  it('dispatches mh:download:has-downloaded when check-download-history responds with isExist=true', () => {
    const listener = jest.fn()
    document.addEventListener('mh:download:has-downloaded', listener, {
      once: true,
    })

    port.onMessage._trigger({
      action: WebExtAction.CheckDownloadHistory,
      status: 'ok',
      payload: { tweetId: '123', isExist: true },
    })

    expect(listener).toHaveBeenCalledTimes(1)
    expect((listener.mock.calls[0][0] as CustomEvent).detail).toEqual({
      tweetId: '123',
    })
  })

  it('does not dispatch mh:download:has-downloaded when isExist=false', () => {
    const listener = jest.fn()
    document.addEventListener('mh:download:has-downloaded', listener, {
      once: true,
    })

    port.onMessage._trigger({
      action: WebExtAction.CheckDownloadHistory,
      status: 'ok',
      payload: { tweetId: '123', isExist: false },
    })

    expect(listener).not.toHaveBeenCalled()
    document.removeEventListener('mh:download:has-downloaded', listener)
  })

  it('dispatches mh:download:has-downloaded when download-media responds ok', () => {
    const listener = jest.fn()
    document.addEventListener('mh:download:has-downloaded', listener, {
      once: true,
    })

    port.onMessage._trigger({
      action: WebExtAction.DownloadMedia,
      status: 'ok',
      payload: { tweetId: '456' },
    })

    expect(listener).toHaveBeenCalledTimes(1)
    expect((listener.mock.calls[0][0] as CustomEvent).detail).toEqual({
      tweetId: '456',
    })
  })

  it('dispatches mh:download:is-failed when download-media responds with error', () => {
    const listener = jest.fn()
    document.addEventListener('mh:download:is-failed', listener, { once: true })

    port.onMessage._trigger({
      action: WebExtAction.DownloadMedia,
      status: 'error',
      tweetId: '789',
      reason: 'Failed',
    })

    expect(listener).toHaveBeenCalledTimes(1)
    expect((listener.mock.calls[0][0] as CustomEvent).detail).toEqual({
      tweetId: '789',
    })
  })
})
