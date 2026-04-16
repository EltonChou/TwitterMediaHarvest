/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { runtime } from 'webextension-polyfill'

export const enum MessagePortName {
  ContentScript = 'content-script',
}

export type OneShotMessage<M> = {
  inner: M
  isOneShot: true
}

export const isOneShotMessage = (
  value: unknown
): value is OneShotMessage<unknown> =>
  typeof value === 'object' &&
  value !== null &&
  'isOneShot' in value &&
  (value as OneShotMessage<unknown>).isOneShot === true &&
  'inner' in value

type MessagePortHandle = {
  port: ReturnType<typeof runtime.connect>
  clear: () => void
}

/**
 * Returns a cached handle for the named long-lived port, creating one if it
 * does not exist. The handle exposes the raw `port` and a `clear` function
 * that disconnects the port and removes it from the cache.
 * @see {@link https://developer.chrome.com/docs/extensions/develop/concepts/messaging#port-lifetime|Port lifetime docs}
 */
export const getMessagePort = (() => {
  const cache = new Map<MessagePortName, MessagePortHandle>()
  return (name: MessagePortName): MessagePortHandle => {
    const existing = cache.get(name)
    if (existing) return existing

    const port = runtime.connect({ name })
    const clear = () => {
      port.disconnect()
      cache.delete(name)
    }
    const handle: MessagePortHandle = { port, clear }
    cache.set(name, handle)
    port.onDisconnect.addListener(() => cache.delete(name))
    return handle
  }
})()
