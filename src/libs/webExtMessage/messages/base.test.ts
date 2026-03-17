/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { isOneShotMessage } from '../port'
import { CaptureResponseMessage, ResponseType } from './captureResponse'

describe('asOneShot()', () => {
  it('produces a one-shot envelope with isOneShot=true', () => {
    const message = new CaptureResponseMessage({
      type: ResponseType.TweetDetail,
      body: 'test',
    })

    const oneShot = message.asOneShot()

    expect(oneShot.isOneShot).toBe(true)
    expect(oneShot.inner).toBe(message)
  })
})

describe('isOneShotMessage()', () => {
  it('returns true for a valid one-shot envelope', () => {
    const message = new CaptureResponseMessage({
      type: ResponseType.TweetDetail,
      body: 'test',
    })

    expect(isOneShotMessage(message.asOneShot())).toBe(true)
  })

  it('returns false for a plain message object', () => {
    const message = new CaptureResponseMessage({
      type: ResponseType.TweetDetail,
      body: 'test',
    })

    expect(isOneShotMessage(message.toObject())).toBe(false)
  })

  it('returns false for null', () => {
    expect(isOneShotMessage(null)).toBe(false)
  })

  it('returns false for non-object', () => {
    expect(isOneShotMessage('string')).toBe(false)
    expect(isOneShotMessage(42)).toBe(false)
  })

  it('returns false when isOneShot is missing', () => {
    expect(isOneShotMessage({ inner: {} })).toBe(false)
  })
})
