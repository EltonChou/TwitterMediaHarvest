import { runtime } from 'webextension-polyfill'

/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

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

export const getMessagePort = (() => {
  const cache = new Map<MessagePortName, ReturnType<typeof runtime.connect>>()
  return (name: MessagePortName) => {
    const existing = cache.get(name)
    if (existing) return existing
    const port = runtime.connect({ name })
    cache.set(name, port)
    port.onDisconnect.addListener(() => cache.delete(name))
    return port
  }
})()
