/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { setDuration } from '#helpers/time'
import { topicLogger } from '#libs/loggers'
import {
  WebExtAction,
  WebExtMessage,
  isDedupableMessage,
  isWebExtMessage,
  isWebExtResponse,
} from './messages/base'
import { MessagePortName } from './port'
import type { Runtime } from 'webextension-polyfill'
import { runtime } from 'webextension-polyfill'

type PortMessageListener = (message: unknown, port: Runtime.Port) => void

type DurationTimer = ReturnType<typeof setDuration>

type PortEntry = {
  port?: Runtime.Port
  listeners: Set<PortMessageListener>
  dedupes: Map<string, ReturnType<typeof setTimeout>>
  lastSentAt?: Map<string, DurationTimer>
}

const DEFAULT_DEDUPE_TTL_MS = 300

const trafficLogger = topicLogger('port-traffic')

const trafficKeyOf = (message: PortPayload): string => {
  if (isDedupableMessage(message)) return `dedupe:${message.dedupeId}`
  if (isWebExtMessage(message)) {
    const { action } = message.toJSON() as { action: WebExtAction }
    return `action:${action}`
  }
  return 'response'
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
    const entry = this.getEntry(name)
    if (isDedupableMessage(message)) {
      const key = message.dedupeId
      if (entry.dedupes.has(key)) {
        if (__DEV__) this.logTraffic(entry, name, message, 'deduped')
        return
      }
      const ttl = message.dedupeTtlMs ?? DEFAULT_DEDUPE_TTL_MS
      const timer = setTimeout(() => {
        entry.dedupes.delete(key)
      }, ttl)
      entry.dedupes.set(key, timer)
    }
    if (__DEV__) this.logTraffic(entry, name, message, 'sent')
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
      entry = {
        listeners: new Set(),
        dedupes: new Map(),
        lastSentAt: __DEV__ ? new Map() : undefined,
      }
      this.entries.set(name, entry)
    }
    return entry
  }

  private logTraffic(
    entry: PortEntry,
    name: MessagePortName,
    message: PortPayload,
    outcome: 'sent' | 'deduped'
  ): void {
    if (!entry.lastSentAt) return
    const key = trafficKeyOf(message)
    const lastTimer = entry.lastSentAt.get(key)
    const sinceLastMs = lastTimer ? lastTimer.end() : null
    if (outcome === 'sent') entry.lastSentAt.set(key, setDuration())
    trafficLogger.debug(outcome, {
      port: name,
      key,
      sinceLastMs,
    })
  }

  private connect(name: MessagePortName, entry: PortEntry): Runtime.Port {
    const port = runtime.connect({ name })
    entry.port = port
    for (const listener of entry.listeners) {
      port.onMessage.addListener(listener)
    }
    port.onDisconnect.addListener(() => {
      if (entry.port === port) entry.port = undefined
      for (const timer of entry.dedupes.values()) clearTimeout(timer)
      entry.dedupes.clear()
      entry.lastSentAt?.clear()
    })
    return port
  }
}

const serializePortPayload = (message: PortPayload): unknown => {
  if (isWebExtMessage(message)) return message.toJSON()
  if (isWebExtResponse(message)) return message
  throw new Error('Unsupported port payload')
}

export const getPortManager = (() => {
  let manager: IPortManager
  return () => (manager ||= new PortManager())
})()
