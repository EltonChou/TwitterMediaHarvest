import DownloadCompleted from '#domain/events/DownloadCompleted'
import TweetApiFailed from '#domain/events/TweetApiFailed'
import { TweetInfo } from '#domain/valueObjects/tweetInfo'
import { getEventPublisher } from '#infra/eventPublisher'

describe('unit test for event publisher', () => {
  const publisher = getEventPublisher()
  const mockHandler = jest.fn()

  beforeAll(() => {
    jest.spyOn(console, 'info').mockImplementation(jest.fn())
  })

  afterEach(() => {
    jest.resetAllMocks()
    jest.clearAllMocks()
    publisher.clearAllHandlers()
  })

  it('can register event handler', () => {
    publisher
      .register('api:twitter:failed', mockHandler)
      .register('api:twitter:failed', mockHandler)
      .register('download:status:completed', [mockHandler, mockHandler])
      .register('download:status:completed', [mockHandler, mockHandler])

    publisher.publishAll(
      new TweetApiFailed(new TweetInfo({ screenName: 'Someone', tweetId: '123' }), 403),
      new DownloadCompleted(1)
    )

    expect(mockHandler).toHaveBeenCalledTimes(6)
  })

  it('can publish event', () => {
    const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {
      /** pass */
    })
    const event = new TweetApiFailed(
      new TweetInfo({ screenName: 'Someone', tweetId: '123' }),
      403
    )

    publisher.register('api:twitter:failed', [
      () => {
        throw new Error('Test error')
      },
      mockHandler,
    ])
    publisher.publish(event)
    publisher.publishAll(event, event, event)

    expect(mockHandler).toHaveBeenCalledTimes(4)
    expect(mockConsoleError).toHaveBeenCalledTimes(4)
  })

  it('can clear event handlers', () => {
    const event = new TweetApiFailed(
      new TweetInfo({ screenName: 'Someone', tweetId: '123' }),
      403
    )

    publisher.register('api:twitter:failed', [
      () => {
        throw new Error('Test error')
      },
      mockHandler,
    ])
    publisher.clearHandlers('api:twitter:failed')
    publisher.publish(event)

    expect(mockHandler).toHaveBeenCalledTimes(0)
  })
})
