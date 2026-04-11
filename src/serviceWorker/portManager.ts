/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { MessagePortName } from '#libs/webExtMessage/port'
import type { Runtime } from 'webextension-polyfill'

export interface PortManager {
  register(port: Runtime.Port): void
  getPorts(name: MessagePortName): ReadonlySet<Runtime.Port>
}

export class PortManagerImpl implements PortManager {
  private portMap: Map<MessagePortName, Set<Runtime.Port>>

  constructor() {
    this.portMap = new Map()
  }

  register(port: Runtime.Port): void {
    const name = port.name as MessagePortName
    if (!this.portMap.has(name)) {
      this.portMap.set(name, new Set())
    }
    const ports = this.portMap.get(name)!
    ports.add(port)

    port.onDisconnect.addListener(() => {
      ports.delete(port)
    })
  }

  getPorts(name: MessagePortName): ReadonlySet<Runtime.Port> {
    return this.portMap.get(name) ?? new Set()
  }
}

export const getPortManager = (() => {
  let manager: PortManager
  return () => (manager ||= new PortManagerImpl())
})()
