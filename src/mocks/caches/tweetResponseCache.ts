import type { ICache } from '#domain/repositories/cache'
import { TweetWithContent } from '#domain/valueObjects/tweetWithContent'
import { toErrorResult } from '#utils/result'

export class MockTweetResponseCache implements ICache<TweetWithContent> {
  async get(
    _cacheId: string
  ): AsyncResult<TweetWithContent | undefined, Error> {
    return toErrorResult(new Error('Method not implemented.'))
  }

  async save(_item: TweetWithContent): Promise<UnsafeTask> {
    return new Error('Method not implemented.')
  }

  async saveAll(..._items: TweetWithContent[]): Promise<UnsafeTask> {
    return new Error('Method not implemented.')
  }
}
