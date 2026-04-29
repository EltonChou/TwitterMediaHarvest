/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import {
  WebExtAction,
  WebExtMessage,
  isWebExtMessage,
  isWebExtResponse,
} from './messages/base'
import { MessagePortName } from './port'
import type { Runtime } from 'webextension-polyfill'
import { runtime } from 'webextension-polyfill'

type PortMessageListener = (message: unknown, port: Runtime.Port) => void

type PortEntry = {
  port?: Runtime.Port
  listeners: Set<PortMessageListener>
}

/**
 * A request (a {@link WebExtMessage} instance) or a response object
 * (anything carrying `isResponse: true`, e.g. produced by `makeResponse`).
 * Requests are serialized via {@link WebExtMessage.toObject} before being
 * posted; response objects are posted as-is.
 */
export type PortPayload = WebExtMessage<WebExtAction> | { isResponse: true }

/**
 * Owns long-lived ports for any port initiator (content scripts, popups,
 * options pages, etc.).
 *
 * Service workers may go idle and disconnect ports at any time. When that
 * happens, any listener attached to the disconnected port is lost. This
 * manager keeps the listener set per port name so that on the next access —
 * or immediately, when triggered by a disconnect — the manager can rebuild
 * the port and re-attach all listeners transparently.
 */
export interface IPortManager {
  /** Registers a listener for messages on the named port. Re-attached on every reconnect. */
  addMessageListener(name: MessagePortName, listener: PortMessageListener): void
  /**
   * Posts a request or response through the named port. Connects (or
   * reconnects) lazily. Requests are serialized via `toObject()`; responses
   * are posted as-is.
   */
  postMessage(name: MessagePortName, message: PortPayload): void
  /** Returns the live port for the given name, connecting if needed. */
  getPort(name: MessagePortName): Runtime.Port
}

export class PortManager implements IPortManager {
  private entries: Map<MessagePortName, PortEntry>

  constructor() {
    this.entries = new Map()
  }

  addMessageListener(
    name: MessagePortName,
    listener: PortMessageListener
  ): void {
    const entry = this.getEntry(name)
    entry.listeners.add(listener)
    if (entry.port) entry.port.onMessage.addListener(listener)
  }

  postMessage(name: MessagePortName, message: PortPayload): void {
    this.getPort(name).postMessage(serializePortPayload(message))
  }

  getPort(name: MessagePortName): Runtime.Port {
    const entry = this.getEntry(name)
    if (entry.port) return entry.port
    return this.connect(name, entry)
  }

  private getEntry(name: MessagePortName): PortEntry {
    let entry = this.entries.get(name)
    if (!entry) {
      entry = { listeners: new Set() }
      this.entries.set(name, entry)
    }
    return entry
  }

  private connect(name: MessagePortName, entry: PortEntry): Runtime.Port {
    const port = runtime.connect({ name })
    entry.port = port
    for (const listener of entry.listeners) {
      port.onMessage.addListener(listener)
    }
    port.onDisconnect.addListener(() => {
      if (entry.port === port) entry.port = undefined
    })
    return port
  }
}

const serializePortPayload = (message: PortPayload): unknown => {
  if (isWebExtMessage(message)) return message.toObject()
  if (isWebExtResponse(message)) return message
  throw new Error('Unsupported port payload')
}

export const getPortManager = (() => {
  let manager: IPortManager
  return () => (manager ||= new PortManager())
})()
