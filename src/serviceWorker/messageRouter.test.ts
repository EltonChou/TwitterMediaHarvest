import { WebExtAction } from '#libs/webExtMessage'
import { getMessageRouter } from './messageRouter'

describe('unit test for message router', () => {
  const router = getMessageRouter()

  afterEach(() => jest.resetAllMocks())

  it('can route valid message', async () => {
    const mockHandler = jest.fn()

    router.route(WebExtAction.DownloadMedia, mockHandler)

    await router.handle({
      message: { action: WebExtAction.DownloadMedia },
      sender: {},
      response: jest.fn(),
    })

    expect(mockHandler).toHaveBeenCalled()
  })

  it('can reject invalid message', async () => {
    const mockHandler = jest.fn()
    const mockResponse = jest.fn()

    router.route(WebExtAction.DownloadMedia, mockHandler)

    await router.handle({
      message: { kappa: 'keepo' },
      sender: {},
      response: mockResponse,
    })

    expect(mockHandler).not.toHaveBeenCalled()
    expect(mockResponse).toHaveBeenCalled()
  })

  it('can response valid message if there is no handler', async () => {
    const mockHandler = jest.fn()
    const mockResponse = jest.fn()

    router.route(WebExtAction.DownloadMedia, mockHandler)

    await router.handle({
      message: { action: WebExtAction.CheckDownloadHistory },
      sender: {},
      response: mockResponse,
    })

    expect(mockHandler).not.toHaveBeenCalled()
    expect(mockResponse).toHaveBeenCalled()
  })
})
