import { CheckDownloadHistoryMessage } from './checkDownloadHistory'

describe('unit test for download tweet media web ext message', () => {
  it('can validate valid message', () => {
    const message = new CheckDownloadHistoryMessage({ tweetId: '123' })
    const { value, error } = CheckDownloadHistoryMessage.validate(
      message.toObject()
    )

    expect(value).toBeDefined()
    expect(error).toBeUndefined()
  })

  it('can validate invalid message', () => {
    const { value, error } = CheckDownloadHistoryMessage.validate('123')

    expect(error).toBeDefined()
    expect(value).toBeUndefined()
  })

  it('isResponse returns true for a valid response object', () => {
    const message = new CheckDownloadHistoryMessage({ tweetId: '123' })
    expect(
      CheckDownloadHistoryMessage.isResponse(
        message.makeResponse(true, { isExist: true })
      )
    ).toBe(true)
    expect(
      CheckDownloadHistoryMessage.isResponse(
        message.makeResponse(false, 'nope')
      )
    ).toBe(true)
  })

  it('isResponse returns false for non-response values', () => {
    expect(CheckDownloadHistoryMessage.isResponse(null)).toBe(false)
    expect(CheckDownloadHistoryMessage.isResponse('string')).toBe(false)
    expect(
      CheckDownloadHistoryMessage.isResponse({
        action: 'download-media',
        status: 'ok',
      })
    ).toBe(false)
    expect(CheckDownloadHistoryMessage.isResponse({ status: 'ok' })).toBe(false)
  })

  it('can make response', () => {
    const message = new CheckDownloadHistoryMessage({ tweetId: '123' })

    const okResp = message.makeResponse(true, { isExist: true })
    expect(okResp.status).toBe('ok')
    expect(okResp.action).toBe('check-download-history')
    expect(okResp.payload.isExist).toBeTruthy()

    const errResp = message.makeResponse(false, 'nope')
    expect(errResp.status).toBe('error')
    expect(errResp.action).toBe('check-download-history')
    expect(errResp.reason).toBe('nope')
  })
})
