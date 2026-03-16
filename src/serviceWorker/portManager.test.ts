/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { MessagePortName } from '#libs/webExtMessage/port'
import { PortManagerImpl } from './portManager'
import type { Runtime } from 'webextension-polyfill'

const makePort = (name: MessagePortName): Runtime.Port => {
  const listeners: (() => void)[] = []
  return {
    name,
    disconnect: jest.fn(),
    postMessage: jest.fn(),
    onMessage: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
      hasListener: jest.fn(),
    },
    onDisconnect: {
      addListener: (listener: () => void) => listeners.push(listener),
      removeListener: jest.fn(),
      hasListener: jest.fn(),
      _trigger: () => listeners.forEach(l => l()),
    },
  } as unknown as Runtime.Port & { onDisconnect: { _trigger: () => void } }
}

describe('PortManagerImpl', () => {
  it('registers and retrieves a port', () => {
    const manager = new PortManagerImpl()
    const port = makePort(MessagePortName.ContentScript)

    manager.register(port)

    expect(manager.getPort(MessagePortName.ContentScript)).toBe(port)
  })

  it('returns undefined when no ports are registered', () => {
    const manager = new PortManagerImpl()

    expect(manager.getPort(MessagePortName.ContentScript)).toBeUndefined()
  })

  it('removes port from set on disconnect', () => {
    const manager = new PortManagerImpl()
    const port = makePort(MessagePortName.ContentScript) as Runtime.Port & {
      onDisconnect: { _trigger: () => void }
    }

    manager.register(port)
    expect(manager.getPort(MessagePortName.ContentScript)).toBe(port)

    port.onDisconnect._trigger()

    expect(manager.getPort(MessagePortName.ContentScript)).toBeUndefined()
  })

  it('getPorts returns all ports for a name', () => {
    const manager = new PortManagerImpl()
    const port1 = makePort(MessagePortName.ContentScript)
    const port2 = makePort(MessagePortName.ContentScript)

    manager.register(port1)
    manager.register(port2)

    const ports = manager.getPorts(MessagePortName.ContentScript)
    expect(ports.size).toBe(2)
    expect(ports.has(port1)).toBe(true)
    expect(ports.has(port2)).toBe(true)
  })

  it('getPorts returns empty set when nothing is registered', () => {
    const manager = new PortManagerImpl()
    expect(manager.getPorts(MessagePortName.ContentScript).size).toBe(0)
  })

  it('getPort returns undefined after all ports disconnect', () => {
    const manager = new PortManagerImpl()
    const port1 = makePort(MessagePortName.ContentScript) as Runtime.Port & {
      onDisconnect: { _trigger: () => void }
    }
    const port2 = makePort(MessagePortName.ContentScript) as Runtime.Port & {
      onDisconnect: { _trigger: () => void }
    }

    manager.register(port1)
    manager.register(port2)

    port1.onDisconnect._trigger()
    port2.onDisconnect._trigger()

    expect(manager.getPort(MessagePortName.ContentScript)).toBeUndefined()
  })
})
