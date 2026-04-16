/**
 * @jest-environment jsdom
 */
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
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
} => {
  const disconnectListeners: (() => void)[] = []
  return {
    name: 'content-script',
    disconnect: jest.fn(),
    postMessage: jest.fn(),
    onMessage: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
      hasListener: jest.fn(),
    },
    onDisconnect: {
      addListener: (listener: () => void) => disconnectListeners.push(listener),
      removeListener: jest.fn(),
      hasListener: jest.fn(),
      _trigger: () => disconnectListeners.forEach(l => l()),
    },
  } as unknown as Runtime.Port & {
    onDisconnect: { _trigger: () => void }
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
