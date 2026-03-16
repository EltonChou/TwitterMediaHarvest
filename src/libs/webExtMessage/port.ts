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
  correlationId: string
  isOneShot: true
}

export const isOneShotMessage = (
  value: unknown
): value is OneShotMessage<unknown> =>
  typeof value === 'object' &&
  value !== null &&
  'isOneShot' in value &&
  (value as OneShotMessage<unknown>).isOneShot === true &&
  'correlationId' in value &&
  typeof (value as OneShotMessage<unknown>).correlationId === 'string' &&
  'inner' in value
