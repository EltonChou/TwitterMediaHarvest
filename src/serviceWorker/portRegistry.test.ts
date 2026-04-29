/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { MessagePortName } from '#libs/webExtMessage/port'
import { MockPort, makeMockPort } from '#mocks/port'
import { PortRegistry } from './portRegistry'

describe('PortRegistry', () => {
  it('removes port from set on disconnect', () => {
    const registry = new PortRegistry()
    const port: MockPort = makeMockPort(MessagePortName.ContentScript)

    registry.register(port)
    expect(registry.getPorts(MessagePortName.ContentScript).size).toBe(1)

    port.onDisconnect._trigger()

    expect(registry.getPorts(MessagePortName.ContentScript).size).toBe(0)
  })

  it('getPorts returns all ports for a name', () => {
    const registry = new PortRegistry()
    const port1 = makeMockPort(MessagePortName.ContentScript)
    const port2 = makeMockPort(MessagePortName.ContentScript)

    registry.register(port1)
    registry.register(port2)

    const ports = registry.getPorts(MessagePortName.ContentScript)
    expect(ports.size).toBe(2)
    expect(ports.has(port1)).toBe(true)
    expect(ports.has(port2)).toBe(true)
  })

  it('getPorts returns empty set when nothing is registered', () => {
    const registry = new PortRegistry()
    expect(registry.getPorts(MessagePortName.ContentScript).size).toBe(0)
  })
})
