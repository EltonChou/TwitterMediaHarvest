import TweetApiFailed from '#domain/events/TweetApiFailed'
import { getNotifier } from '#infra/browserNotifier'
import { notifyTweetApiError } from './notifyTweetApiError'

describe('unit test for handler to notify tweet api error', () => {
  it('can handle tweet api error event', async () => {
    const notifier = getNotifier()
    const mockNotify = jest.spyOn(notifier, 'notify')
    const handle = notifyTweetApiError(notifier)

    const tweetInfo = {
      screenName: 'name',
      tweetId: 'tweet-id',
    }

    const unauthorizedEvent = new TweetApiFailed(tweetInfo, 401)
    const forbiddenEvent = new TweetApiFailed(tweetInfo, 403)
    const notFoundEvent = new TweetApiFailed(tweetInfo, 404)
    const tooManyRequestEvent = new TweetApiFailed(tweetInfo, 429)
    const unknownErrorEvent = new TweetApiFailed(tweetInfo, 500)

    await Promise.all([
      handle(notFoundEvent),
      handle(unknownErrorEvent),
      handle(tooManyRequestEvent),
      handle(unauthorizedEvent),
      handle(forbiddenEvent),
    ])

    expect(mockNotify).toHaveBeenCalledTimes(5)
  })
})
