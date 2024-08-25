import {
  makeDownloadFailedNotificationId,
  makeTweetFetchErrorNotificationId,
} from '#helpers/notificationId'
import { getEventPublisher } from '#infra/eventPublisher'
import handleNotificationClicked from './handleNotificationClicked'

describe('integration test for handler to handle notification clicked event ', () => {
  const eventPublisher = getEventPublisher()
  const mockHandleTweetNotificationClicked = jest.fn()
  const mockHandleDownloadFailedNotificationClicked = jest.fn()

  beforeAll(() => {
    eventPublisher
      .register(
        'notification:tweetFetchError:self:clicked',
        mockHandleTweetNotificationClicked
      )
      .register(
        'notification:downloadFailed:self:clicked',
        mockHandleDownloadFailedNotificationClicked
      )
  })

  afterEach(() => {
    mockHandleDownloadFailedNotificationClicked.mockReset()
    mockHandleTweetNotificationClicked.mockReset()
  })

  afterAll(() => eventPublisher.clearAllHandlers())

  it('can emit notification:tweetFetchError:self:clicked event', async () => {
    const handler = handleNotificationClicked(eventPublisher)
    await handler(makeTweetFetchErrorNotificationId('123'))

    expect(mockHandleTweetNotificationClicked).toHaveBeenCalled()
  })

  it('can emit notification:downloadFailed:self:clicked event', async () => {
    const handler = handleNotificationClicked(eventPublisher)
    await handler(makeDownloadFailedNotificationId(100))

    expect(mockHandleDownloadFailedNotificationClicked).toHaveBeenCalled()
  })
})
