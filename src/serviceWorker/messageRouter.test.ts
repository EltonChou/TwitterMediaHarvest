import { WebExtAction } from '#libs/webExtMessage'
import { MessagePortName } from '#libs/webExtMessage/port'
import { getMessageRouter } from './messageRouter'
import type { Runtime } from 'webextension-polyfill'

const makePort = (
  name: MessagePortName,
  sender: Runtime.MessageSender = {}
): Runtime.Port & { postMessage: jest.Mock } => ({
  name,
  sender,
  disconnect: jest.fn(),
  postMessage: jest.fn(),
  onMessage: {
    addListener: jest.fn(),
    removeListener: jest.fn(),
    hasListener: jest.fn(),
  },
  onDisconnect: {
    addListener: jest.fn(),
    removeListener: jest.fn(),
    hasListener: jest.fn(),
  },
})

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

    await router.handle({
      message: { action: WebExtAction.DownloadMedia, payload: { a: 10 } },
      sender: {},
      response: jest.fn(),
    })

    expect(mockHandler).toHaveBeenCalledTimes(2)
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

describe('MessageRouter.handlePortMessage', () => {
  const router = getMessageRouter()

  afterEach(() => jest.resetAllMocks())

  it('routes a valid fire-and-forget message via port', async () => {
    const mockHandler = jest.fn()
    router.route(WebExtAction.CaptureResponse, mockHandler)

    const port = makePort(MessagePortName.ContentScript)

    await router.handlePortMessage({
      message: { action: WebExtAction.CaptureResponse },
      port,
    })

    expect(mockHandler).toHaveBeenCalledTimes(1)
  })

  it('does not call postMessage for fire-and-forget', async () => {
    const mockHandler = jest.fn().mockImplementation(async ctx => {
      ctx.response({ status: 'ok' })
    })
    router.route(WebExtAction.CaptureResponse, mockHandler)

    const port = makePort(MessagePortName.ContentScript)

    await router.handlePortMessage({
      message: { action: WebExtAction.CaptureResponse },
      port,
    })

    expect(port.postMessage).not.toHaveBeenCalled()
  })

  it('uses port.sender as ctx.sender', async () => {
    const capturedCtx: { sender?: Runtime.MessageSender } = {}
    const mockHandler = jest.fn().mockImplementation(async ctx => {
      capturedCtx.sender = ctx.sender
    })
    router.route(WebExtAction.CaptureResponse, mockHandler)

    const sender: Runtime.MessageSender = { id: 'test-ext-id' }
    const port = makePort(MessagePortName.ContentScript, sender)

    await router.handlePortMessage({
      message: { action: WebExtAction.CaptureResponse },
      port,
    })

    expect(capturedCtx.sender).toBe(sender)
  })
})
