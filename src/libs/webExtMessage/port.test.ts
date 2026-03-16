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
  } as unknown as Runtime.Port & { onDisconnect: { _trigger: () => void } }
}

// Helper to trigger disconnect on the currently cached port (resetting singleton state)
const triggerDisconnectOnCached = () => {
  const port = getMessagePort(MessagePortName.ContentScript) as unknown as {
    onDisconnect: { _trigger: () => void }
  }
  port.onDisconnect._trigger()
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

    const p1 = getMessagePort(MessagePortName.ContentScript)
    const p2 = getMessagePort(MessagePortName.ContentScript)

    expect(p1).toBe(p2)
    expect(mockConnect).toHaveBeenCalledTimes(1)
  })

  it('re-creates the port after disconnect', () => {
    const port1 = makePort()
    const port2 = makePort()
    mockConnect.mockReturnValueOnce(port1).mockReturnValueOnce(port2)

    const p1 = getMessagePort(MessagePortName.ContentScript)
    port1.onDisconnect._trigger()

    const p2 = getMessagePort(MessagePortName.ContentScript)

    expect(p1).toBe(port1)
    expect(p2).toBe(port2)
    expect(mockConnect).toHaveBeenCalledTimes(2)
  })
})
