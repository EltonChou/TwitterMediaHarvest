/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { ConvertMp4ToGifMessage } from './convertMp4ToGif'

describe('unit test for convert mp4 to gif web ext message', () => {
  it('can validate valid message', () => {
    const message = new ConvertMp4ToGifMessage({
      url: 'https://video.twimg.com/tweet_video/GbS7YUabsAAfjEP.mp4',
    })
    const { value, error } = ConvertMp4ToGifMessage.validate(message.toObject())

    expect(value).toBeDefined()
    expect(error).toBeUndefined()
  })

  it('can validate invalid message', () => {
    const { value, error } = ConvertMp4ToGifMessage.validate('123')

    expect(error).toBeDefined()
    expect(value).toBeUndefined()
  })

  it('can make response', () => {
    const message = new ConvertMp4ToGifMessage({
      url: 'https://video.twimg.com/tweet_video/GbS7YUabsAAfjEP.mp4',
    })

    const okResp = message.makeResponse(true, {
      dataUrl: 'data:image/gif;base64,abc',
    })
    expect(okResp.status).toBe('ok')
    expect(okResp.payload.dataUrl).toBe('data:image/gif;base64,abc')

    const errResp = message.makeResponse(false, 'nope')
    expect(errResp.status).toBe('error')
    expect(errResp.reason).toBe('nope')
  })
})
