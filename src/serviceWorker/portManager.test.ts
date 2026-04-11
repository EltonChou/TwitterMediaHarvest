/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { MessagePortName } from '#libs/webExtMessage/port'
import { MockPort, makeMockPort } from '#mocks/port'
import { PortManager } from './portManager'

describe('PortManager', () => {
  it('removes port from set on disconnect', () => {
    const manager = new PortManager()
    const port: MockPort = makeMockPort(MessagePortName.ContentScript)

    manager.register(port)
    expect(manager.getPorts(MessagePortName.ContentScript).size).toBe(1)

    port.onDisconnect._trigger()

    expect(manager.getPorts(MessagePortName.ContentScript).size).toBe(0)
  })

  it('getPorts returns all ports for a name', () => {
    const manager = new PortManager()
    const port1 = makeMockPort(MessagePortName.ContentScript)
    const port2 = makeMockPort(MessagePortName.ContentScript)

    manager.register(port1)
    manager.register(port2)

    const ports = manager.getPorts(MessagePortName.ContentScript)
    expect(ports.size).toBe(2)
    expect(ports.has(port1)).toBe(true)
    expect(ports.has(port2)).toBe(true)
  })

  it('getPorts returns empty set when nothing is registered', () => {
    const manager = new PortManager()
    expect(manager.getPorts(MessagePortName.ContentScript).size).toBe(0)
  })
})
