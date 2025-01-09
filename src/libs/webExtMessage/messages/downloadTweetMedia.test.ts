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

  it('can make response', () => {
    const message = new DownloadTweetMediaMessage({
      screenName: '123',
      tweetId: '123',
    })

    const okResp = message.makeResponse(true)
    expect(okResp.status).toBe('ok')

    const errResp = message.makeResponse(false, 'nope')
    expect(errResp.status).toBe('error')
    expect(errResp.reason).toBe('nope')
  })
})
