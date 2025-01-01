import FilenameIsOverwritten from '#domain/events/FilenameIsOverwritten'
import { getNotifier } from '#infra/browserNotifier'
import { notifyFilenameIsOverwritten } from './notifyFilenameIsOverwritten'
import { MockEventPublisher } from '#mocks/eventPublisher'
import { MockWarningSettingsRepo } from '#mocks/repositories/warningSettings'

describe('unit test for notifyFilenameIsOverwritten handler', () => {
  afterEach(() => {
    jest.resetAllMocks()
    jest.restoreAllMocks()
  })

  it('can notify user', async () => {
    const warningSettingsRepo = new MockWarningSettingsRepo()
    jest
      .spyOn(warningSettingsRepo, 'get')
      .mockResolvedValueOnce({ ignoreFilenameOverwritten: false })
    const notifier = getNotifier()
    const mockNotify = jest.spyOn(notifier, 'notify')
    const publisher = new MockEventPublisher()
    const event = new FilenameIsOverwritten('expected.png', 'final.png')

    await notifyFilenameIsOverwritten(notifier, warningSettingsRepo)(event, publisher)

    expect(mockNotify).toHaveBeenCalledOnce()
  })

  it('can allow user to ignore it', async () => {
    const warningSettingsRepo = new MockWarningSettingsRepo()
    jest
      .spyOn(warningSettingsRepo, 'get')
      .mockResolvedValueOnce({ ignoreFilenameOverwritten: true })
    const notifier = getNotifier()
    const mockNotify = jest.spyOn(notifier, 'notify')
    const publisher = new MockEventPublisher()
    const event = new FilenameIsOverwritten('expected.png', 'final.png')

    await notifyFilenameIsOverwritten(notifier, warningSettingsRepo)(event, publisher)

    expect(mockNotify).not.toHaveBeenCalled()
  })
})
