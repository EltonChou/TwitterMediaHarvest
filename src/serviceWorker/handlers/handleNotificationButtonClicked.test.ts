import {
  makeDownloadFailedNotificationId,
  makeTweetFetchErrorNotificationId,
} from '#helpers/notificationId'
import { getEventPublisher } from '#infra/eventPublisher'
import handleNotificationButtonClicked from './handleNotificationButtonClicked'

describe('integration test for handler to handle notification clicked event ', () => {
  const eventPublisher = getEventPublisher()
  const mockHandleTweetNotificationButtonClicked = jest.fn()
  const mockHandleDownloadFailedNotificationButtonClicked = jest.fn()
  const mockHandlekUnknownButtonClicked = jest.fn()

  beforeAll(() => {
    eventPublisher
      .register(
        'notification:tweetFetchError:viewButton:clicked',
        mockHandleTweetNotificationButtonClicked
      )
      .register(
        'notification:downloadFailed:viewButton:clicked',
        mockHandleDownloadFailedNotificationButtonClicked
      )
      .register(
        'notification:downloadFailed:retryButton:clicked',
        mockHandleDownloadFailedNotificationButtonClicked
      )
      .register(
        'notification:general:unknownButton:clicked',
        mockHandlekUnknownButtonClicked
      )
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  afterAll(() => eventPublisher.clearAllHandlers())

  describe('tweet fetching failed notifiactoin case', () => {
    it('can emit notification:tweetFetchError:viewButton:clicked event', async () => {
      const handler = handleNotificationButtonClicked(eventPublisher)
      await handler(makeTweetFetchErrorNotificationId('123'), 0)

      expect(mockHandleTweetNotificationButtonClicked).toHaveBeenCalled()
    })

    it('can emit notification:general:unknownButton:clicked event', async () => {
      const handler = handleNotificationButtonClicked(eventPublisher)
      await handler(makeTweetFetchErrorNotificationId('123'), 2)

      expect(mockHandleTweetNotificationButtonClicked).not.toHaveBeenCalled()
      expect(mockHandlekUnknownButtonClicked).toHaveBeenCalled()
    })
  })

  describe('download failed notifiactoin case', () => {
    it('can emit notification:downloadFailed:viewButton:clicked event', async () => {
      const handler = handleNotificationButtonClicked(eventPublisher)
      await handler(makeDownloadFailedNotificationId(100), 0)

      expect(
        mockHandleDownloadFailedNotificationButtonClicked
      ).toHaveBeenCalled()
    })

    it('can emit notification:downloadFailed:retryButton:clicked event', async () => {
      const handler = handleNotificationButtonClicked(eventPublisher)
      await handler(makeDownloadFailedNotificationId(100), 1)

      expect(
        mockHandleDownloadFailedNotificationButtonClicked
      ).toHaveBeenCalled()
    })

    it('can emit notification:general:unknownButton:clicked event', async () => {
      const handler = handleNotificationButtonClicked(eventPublisher)
      await handler(makeDownloadFailedNotificationId(100), 2)

      expect(
        mockHandleDownloadFailedNotificationButtonClicked
      ).not.toHaveBeenCalled()
      expect(mockHandlekUnknownButtonClicked).toHaveBeenCalled()
    })
  })
})
