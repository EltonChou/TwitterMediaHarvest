import { WebExtAction } from '#libs/webExtMessage'
import { MessagePortName } from '#libs/webExtMessage/port'
import { makeMockPort } from '#mocks/port'
import { getMessageRouter } from './messageRouter'
import { getPortManager } from './portManager'
import type { Runtime } from 'webextension-polyfill'

const broadcastToContentScript = { broadcast: MessagePortName.ContentScript }

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

describe('MessageRouter broadcast actions', () => {
  const router = getMessageRouter()
  const portManager = getPortManager()

  afterEach(() => jest.resetAllMocks())

  it('broadcasts response to all content-script ports for DownloadMedia', async () => {
    const response = {
      action: WebExtAction.DownloadMedia,
      status: 'ok',
      payload: { tweetId: '1' },
    }
    const mockHandler = jest
      .fn()
      .mockImplementation(async ctx => ctx.response(response))
    router.route(
      WebExtAction.DownloadMedia,
      mockHandler,
      broadcastToContentScript
    )

    const port1 = makeMockPort(MessagePortName.ContentScript)
    const port2 = makeMockPort(MessagePortName.ContentScript)
    portManager.register(port1)
    portManager.register(port2)

    await router.handle({
      message: { action: WebExtAction.DownloadMedia },
      sender: {},
      response: jest.fn(),
    })

    expect(port1.postMessage).toHaveBeenCalledWith(response)
    expect(port2.postMessage).toHaveBeenCalledWith(response)
  })

  it('broadcasts response to all content-script ports for CheckDownloadHistory', async () => {
    const response = {
      action: WebExtAction.CheckDownloadHistory,
      status: 'ok',
      payload: { tweetId: '2', isExist: true },
    }
    const mockHandler = jest
      .fn()
      .mockImplementation(async ctx => ctx.response(response))
    router.route(
      WebExtAction.CheckDownloadHistory,
      mockHandler,
      broadcastToContentScript
    )

    const port1 = makeMockPort(MessagePortName.ContentScript)
    portManager.register(port1)

    await router.handle({
      message: { action: WebExtAction.CheckDownloadHistory },
      sender: {},
      response: jest.fn(),
    })

    expect(port1.postMessage).toHaveBeenCalledWith(response)
  })

  it('does not broadcast for non-broadcast actions', async () => {
    const mockResponse = jest.fn()
    const mockHandler = jest
      .fn()
      .mockImplementation(async ctx => ctx.response({ status: 'ok' }))
    router.route(WebExtAction.CaptureResponse, mockHandler)

    const port1 = makeMockPort(MessagePortName.ContentScript)
    portManager.register(port1)

    await router.handle({
      message: { action: WebExtAction.CaptureResponse },
      sender: {},
      response: mockResponse,
    })

    expect(mockResponse).toHaveBeenCalled()
    expect(port1.postMessage).not.toHaveBeenCalled()
  })
})

describe('MessageRouter.handlePortMessage', () => {
  const router = getMessageRouter()

  afterEach(() => jest.resetAllMocks())

  it('routes a valid fire-and-forget message via port', async () => {
    const mockHandler = jest.fn()
    router.route(WebExtAction.CaptureResponse, mockHandler)

    const port = makeMockPort(MessagePortName.ContentScript)

    await router.handlePortMessage({
      message: { action: WebExtAction.CaptureResponse },
      port,
    })

    expect(mockHandler).toHaveBeenCalledTimes(1)
  })

  it('posts response back over port when handler calls ctx.response', async () => {
    const response = { action: WebExtAction.CaptureResponse, status: 'ok' }
    const mockHandler = jest.fn().mockImplementation(async ctx => {
      ctx.response(response)
    })
    router.route(WebExtAction.CaptureResponse, mockHandler)

    const port = makeMockPort(MessagePortName.ContentScript)

    await router.handlePortMessage({
      message: { action: WebExtAction.CaptureResponse },
      port,
    })

    expect(port.postMessage).toHaveBeenCalledWith(response)
  })

  it('uses port.sender as ctx.sender', async () => {
    const capturedCtx: { sender?: Runtime.MessageSender } = {}
    const mockHandler = jest.fn().mockImplementation(async ctx => {
      capturedCtx.sender = ctx.sender
    })
    router.route(WebExtAction.CaptureResponse, mockHandler)

    const sender: Runtime.MessageSender = { id: 'test-ext-id' }
    const port = makeMockPort(MessagePortName.ContentScript, sender)

    await router.handlePortMessage({
      message: { action: WebExtAction.CaptureResponse },
      port,
    })

    expect(capturedCtx.sender).toBe(sender)
  })
})
