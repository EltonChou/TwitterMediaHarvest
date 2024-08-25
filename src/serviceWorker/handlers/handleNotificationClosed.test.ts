import {
  makeDownloadFailedNotificationId,
  makeTweetFetchErrorNotificationId,
} from '#helpers/notificationId'
import { getEventPublisher } from '#infra/eventPublisher'
import handleNotificationClosed from './handleNotificationClosed'

describe('integration test for handler to handle notification closed event ', () => {
  const eventPublisher = getEventPublisher()
  const mockHandleTweetNotificationClosed = jest.fn()
  const mockHandleDownloadFailedNotificationClosed = jest.fn()

  beforeAll(() => {
    eventPublisher
      .register(
        'notification:downloadFailed:self:closed',
        mockHandleDownloadFailedNotificationClosed
      )
      .register(
        'notification:tweetFetchError:self:closed',
        mockHandleTweetNotificationClosed
      )
  })

  afterEach(() => {
    mockHandleDownloadFailedNotificationClosed.mockReset()
    mockHandleTweetNotificationClosed.mockReset()
  })

  afterAll(() => eventPublisher.clearAllHandlers())

  it('can emit notification:tweetFetchError:self:closed event', async () => {
    const handler = handleNotificationClosed(eventPublisher)
    await handler(makeTweetFetchErrorNotificationId('123'), true)

    expect(mockHandleTweetNotificationClosed).toHaveBeenCalled()
  })

  it('can emit notification:downloadFailed:self:closed event', async () => {
    const handler = handleNotificationClosed(eventPublisher)
    await handler(makeDownloadFailedNotificationId(100), true)

    expect(mockHandleDownloadFailedNotificationClosed).toHaveBeenCalled()
  })
})
