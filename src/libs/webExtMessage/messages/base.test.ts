/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { isWebExtMessage, isWebExtResponse } from './base'
import { CaptureResponseMessage, ResponseType } from './captureResponse'

const makeMessage = () =>
  new CaptureResponseMessage({
    type: ResponseType.TweetDetail,
    body: 'test',
  })

describe('isWebExtMessage()', () => {
  it('returns true for a WebExtMessage instance', () => {
    expect(isWebExtMessage(makeMessage())).toBe(true)
  })

  it('returns false for a plain message object (the toObject() output)', () => {
    expect(isWebExtMessage(makeMessage().toObject())).toBe(false)
  })

  it('returns false for a response object', () => {
    expect(isWebExtMessage(makeMessage().makeResponse(true))).toBe(false)
  })

  it('returns false for null and primitives', () => {
    expect(isWebExtMessage(null)).toBe(false)
    expect(isWebExtMessage('string')).toBe(false)
    expect(isWebExtMessage(42)).toBe(false)
  })
})

describe('isWebExtResponse()', () => {
  it('returns true for a response object', () => {
    expect(isWebExtResponse(makeMessage().makeResponse(true))).toBe(true)
    expect(isWebExtResponse(makeMessage().makeResponse(false, 'reason'))).toBe(
      true
    )
  })

  it('returns false for a WebExtMessage instance', () => {
    expect(isWebExtResponse(makeMessage())).toBe(false)
  })

  it('returns false for a plain message object', () => {
    expect(isWebExtResponse(makeMessage().toObject())).toBe(false)
  })

  it('returns false for null and primitives', () => {
    expect(isWebExtResponse(null)).toBe(false)
    expect(isWebExtResponse('string')).toBe(false)
    expect(isWebExtResponse(42)).toBe(false)
  })
})
