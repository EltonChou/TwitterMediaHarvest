/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import {
  CaptureResponseMessage,
  ResponseType,
} from './messages/captureResponse'
import { sendMessage } from './sendMessage'
import { runtime } from 'webextension-polyfill'

jest.mock('webextension-polyfill', () => ({
  runtime: { sendMessage: jest.fn() },
  tabs: {},
}))

describe('sendMessage()', () => {
  beforeEach(() => jest.clearAllMocks())

  it('serializes the message via toObject() and forwards to runtime.sendMessage', async () => {
    const message = new CaptureResponseMessage({
      type: ResponseType.TweetDetail,
      body: 'test',
    })
    const expectedResult = { isResponse: true, status: 'ok' }
    jest.mocked(runtime.sendMessage).mockResolvedValue(expectedResult)

    const result = await sendMessage(message)

    expect(runtime.sendMessage).toHaveBeenCalledWith(message.toObject())
    expect(result).toEqual(expectedResult)
  })
})
