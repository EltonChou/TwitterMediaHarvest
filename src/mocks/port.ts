/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import type { MessagePortName } from '#libs/webExtMessage/port'
import type { Runtime } from 'webextension-polyfill'

export type MockPort = Runtime.Port & {
  postMessage: jest.Mock
  onDisconnect: Runtime.Port['onDisconnect'] & { _trigger: () => void }
}

export const makeMockPort = (
  name: MessagePortName,
  sender: Runtime.MessageSender = {}
): MockPort => {
  const disconnectListeners: (() => void)[] = []
  return {
    name,
    sender,
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
  } as unknown as MockPort
}
