import { DownloadTweetMediaMessage } from './downloadTweetMedia'

describe('unit test for download tweet media web ext message', () => {
  it('can validate valid message', () => {
    const message = new DownloadTweetMediaMessage({
      screenName: '123',
      tweetId: '123',
    })
    const { value, error } = DownloadTweetMediaMessage.validate(
      message.toObject()
    )

    expect(value).toBeDefined()
    expect(error).toBeUndefined()
  })

  it('can validate invalid message', () => {
    const { value, error } = DownloadTweetMediaMessage.validate('123')

    expect(error).toBeDefined()
    expect(value).toBeUndefined()
  })

  it('isResponse returns true for a valid response object', () => {
    const message = new DownloadTweetMediaMessage({
      screenName: '123',
      tweetId: '123',
    })
    expect(
      DownloadTweetMediaMessage.isResponse(message.makeResponse(true))
    ).toBe(true)
    expect(
      DownloadTweetMediaMessage.isResponse(message.makeResponse(false, 'nope'))
    ).toBe(true)
  })

  it('isResponse returns false for non-response values', () => {
    expect(DownloadTweetMediaMessage.isResponse(null)).toBe(false)
    expect(DownloadTweetMediaMessage.isResponse('string')).toBe(false)
    expect(
      DownloadTweetMediaMessage.isResponse({
        action: 'check-download-history',
        status: 'ok',
      })
    ).toBe(false)
    expect(DownloadTweetMediaMessage.isResponse({ status: 'ok' })).toBe(false)
  })

  it('can make response', () => {
    const message = new DownloadTweetMediaMessage({
      screenName: '123',
      tweetId: '123',
    })

    const okResp = message.makeResponse(true)
    expect(okResp.status).toBe('ok')
    expect(okResp.action).toBe('download-media')

    const errResp = message.makeResponse(false, 'nope')
    expect(errResp.status).toBe('error')
    expect(errResp.action).toBe('download-media')
    expect(errResp.reason).toBe('nope')
  })
})
