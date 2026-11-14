import type { ICache } from '#domain/repositories/cache'
import type { Tweet } from '#domain/valueObjects/tweet'
import { toErrorResult } from '#utils/result'

export class MockTweetResponseCache implements ICache<Tweet> {
  async get(_cacheId: string): AsyncResult<Tweet | undefined, Error> {
    return toErrorResult(new Error('Method not implemented.'))
  }

  async save(_item: Tweet): Promise<UnsafeTask> {
    return new Error('Method not implemented.')
  }

  async saveAll(..._items: Tweet[]): Promise<UnsafeTask> {
    return new Error('Method not implemented.')
  }

  async clean(): Promise<UnsafeTask> {
    return new Error('Method not implemented.')
  }

  async evictExpired(): Promise<UnsafeTask> {
    return new Error('Method not implemented.')
  }
}
