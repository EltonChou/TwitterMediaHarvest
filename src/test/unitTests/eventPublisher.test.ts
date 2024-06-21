import TweetApiFailed from '#domain/events/TweetApiFailed'
import { getEventPublisher } from '#infra/eventPublisher'

describe('unit test for event publisher', () => {
  const publisher = getEventPublisher()
  const mockHandler = jest.fn()

  afterEach(() => {
    jest.resetAllMocks()
    jest.clearAllMocks()
    publisher.clearAllHandlers()
  })

  it('can register event handler', () => {
    publisher.register('api:twitter:failed', mockHandler)
    publisher.register('download:completed', mockHandler)
    publisher.register('download:completed', mockHandler)
  })

  it('can publish event', () => {
    const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {
      /** pass */
    })
    const event = new TweetApiFailed({ screenName: 'Someone', tweetId: '123' }, 403)

    publisher.register('api:twitter:failed', () => {
      throw new Error('Test error')
    })
    publisher.register('api:twitter:failed', mockHandler)
    publisher.publish(event)
    publisher.publishAll(event, event, event)

    expect(mockHandler).toBeCalledTimes(4)
    expect(mockConsoleError).toBeCalledTimes(4)
  })

  it('can clear event handlers', () => {
    const event = new TweetApiFailed({ screenName: 'Someone', tweetId: '123' }, 403)

    publisher.register('api:twitter:failed', () => {
      throw new Error('Test error')
    })
    publisher.register('api:twitter:failed', mockHandler)
    publisher.clearHandlers('api:twitter:failed')
    publisher.publish(event)

    expect(mockHandler).toBeCalledTimes(0)
  })
})
