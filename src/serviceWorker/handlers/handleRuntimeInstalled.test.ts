import { getEventPublisher } from '#infra/eventPublisher'
import handleRuntimeInstalled from './handleRuntimeInstalled'
import Browser from 'webextension-polyfill'

describe('integration test for handler to handle runtime installed event ', () => {
  const eventPublisher = getEventPublisher()
  const mockHandlerRuntimeInstalled = jest.fn()
  const mockHandlerRuntimeUpdated = jest.fn()

  jest.spyOn(Browser.runtime, 'getManifest').mockReturnValue({
    manifest_version: 3,
    name: 'mh-test',
    version: '5.0.0',
    version_name: '5.0.0 (test)',
  })

  beforeAll(() => {
    eventPublisher
      .register('runtime:status:installed', mockHandlerRuntimeInstalled)
      .register('runtime:status:updated', mockHandlerRuntimeUpdated)
  })

  afterEach(() => {
    mockHandlerRuntimeInstalled.mockReset()
    mockHandlerRuntimeUpdated.mockReset()
  })

  afterAll(() => eventPublisher.clearAllHandlers())

  it('can emit runtime:status:installed event', async () => {
    const handler = handleRuntimeInstalled(eventPublisher)

    await handler({ reason: 'install', temporary: false })
    expect(mockHandlerRuntimeInstalled).toHaveBeenCalled()
  })

  it('can emit runtime:status:updated event', async () => {
    const handler = handleRuntimeInstalled(eventPublisher)

    await handler({
      reason: 'update',
      temporary: false,
      previousVersion: '4.0.0',
    })
    expect(mockHandlerRuntimeUpdated).toHaveBeenCalled()
  })

  it('can ignore browser updated event', async () => {
    const handler = handleRuntimeInstalled(eventPublisher)

    await handler({ reason: 'browser_update', temporary: false })
    expect(mockHandlerRuntimeInstalled).not.toHaveBeenCalled()
    expect(mockHandlerRuntimeUpdated).not.toHaveBeenCalled()
  })
})
