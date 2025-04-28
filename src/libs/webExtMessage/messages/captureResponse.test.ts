import { CaptureResponseMessage, ResponseType } from './captureResponse'

describe('unit test for capture response web ext message', () => {
  it('can validate valid message', () => {
    const message = new CaptureResponseMessage({
      type: ResponseType.TweetDetail,
      body: 'test body',
    })
    const { value, error } = CaptureResponseMessage.validate(message.toObject())

    expect(value).toBeDefined()
    expect(error).toBeUndefined()
  })

  it('can validate invalid message', () => {
    const { value, error } = CaptureResponseMessage.validate('123')

    expect(error).toBeDefined()
    expect(value).toBeUndefined()
  })

  it('can make response', () => {
    const message = new CaptureResponseMessage({
      type: ResponseType.TweetDetail,
      body: 'test body',
    })

    const okResp = message.makeResponse(true)
    expect(okResp.status).toBe('ok')

    const errResp = message.makeResponse(false, 'error message')
    expect(errResp.status).toBe('error')
    expect(errResp.reason).toBe('error message')
  })
})
