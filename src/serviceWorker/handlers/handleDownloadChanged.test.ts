import { CheckDownloadWasTriggeredBySelf } from '#domain/useCases/checkDownloadWasTriggeredBySelf'
import { getEventPublisher } from '#infra/eventPublisher'
import { MockDownloadRepo } from '#mocks/repositories/download'
import handleDownloadChanged from './handleDownloadChanged'

describe('integration test for download changed event handler', () => {
  const eventPublisher = getEventPublisher()
  const mockDownloadCompletedHandler = jest.fn()
  const mockDownloadInterruptedHandler = jest.fn()
  const extensionId = 'ext-id'
  const checkDownloadIsOwnBySelf = new CheckDownloadWasTriggeredBySelf(
    extensionId
  )
  const downloadRepo = new MockDownloadRepo()
  const handler = handleDownloadChanged(
    downloadRepo,
    checkDownloadIsOwnBySelf,
    eventPublisher
  )

  beforeAll(() => {
    eventPublisher
      .register('download:status:completed', mockDownloadCompletedHandler)
      .register('download:status:interrupted', mockDownloadInterruptedHandler)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  /**
   * type State = "in_progress" | "interrupted" | "complete";
   */
  it('can emit download:status:completed event', async () => {
    jest.spyOn(downloadRepo, 'getById').mockResolvedValue({
      id: 1,
      fileSize: 0,
      filename: 'filename',
      byExtensionId: extensionId,
      url: 'url',
    })
    await handler({
      id: 1,
      state: { current: 'complete', previous: 'in_progress' },
    })
    expect(mockDownloadCompletedHandler).toHaveBeenCalled()
  })

  it('can emit download:status:interrupted event', async () => {
    jest.spyOn(downloadRepo, 'getById').mockResolvedValue({
      id: 1,
      fileSize: 0,
      filename: 'filename',
      byExtensionId: extensionId,
      url: 'url',
    })
    await handler({
      id: 1,
      state: { current: 'interrupted', previous: 'in_progress' },
    })
    expect(mockDownloadInterruptedHandler).toHaveBeenCalled()
  })

  it('can ignore download which was not triggered by self', async () => {
    jest.spyOn(downloadRepo, 'getById').mockResolvedValue({
      id: 1,
      fileSize: 0,
      filename: 'filename',
      byExtensionId: 'other',
      url: 'url',
    })

    await handler({
      id: 1,
      state: { current: 'interrupted', previous: 'in_progress' },
    })
    await handler({
      id: 1,
      state: { current: 'complete', previous: 'in_progress' },
    })
    expect(mockDownloadInterruptedHandler).not.toHaveBeenCalled()
    expect(mockDownloadCompletedHandler).not.toHaveBeenCalled()
  })

  it('can ignore download which might be lost for some reason.', async () => {
    jest.spyOn(downloadRepo, 'getById').mockResolvedValue(undefined)

    await handler({
      id: 1,
      state: { current: 'interrupted', previous: 'in_progress' },
    })
    await handler({
      id: 1,
      state: { current: 'complete', previous: 'in_progress' },
    })
    expect(mockDownloadInterruptedHandler).not.toHaveBeenCalled()
    expect(mockDownloadCompletedHandler).not.toHaveBeenCalled()
  })
})
