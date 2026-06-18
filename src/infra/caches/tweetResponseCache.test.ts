/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { TweetResponseCache } from './tweetResponseCache'

const CACHE_TIME = 86400 // 24 hours, in seconds

/** Minimal in-memory stand-in for the Cache API. */
class FakeCache {
  private store = new Map<string, Response>()

  async keys(): Promise<Request[]> {
    return [...this.store.keys()].map(url => new Request(url))
  }

  async match(request: Request): Promise<Response | undefined> {
    return this.store.get(request.url)
  }

  async put(request: Request, response: Response): Promise<void> {
    this.store.set(request.url, response)
  }

  async delete(request: Request): Promise<boolean> {
    return this.store.delete(request.url)
  }
}

class TestableTweetResponseCache extends TweetResponseCache {
  constructor(private fakeCache: FakeCache) {
    super()
  }

  protected async getCache() {
    return this.fakeCache as unknown as Cache
  }
}

const makeResponseWithDate = (date: string): Response =>
  new Response('{}', { headers: { Date: date } })

describe('TweetResponseCache.evictExpired', () => {
  let fakeCache: FakeCache
  let cache: TestableTweetResponseCache

  beforeEach(() => {
    fakeCache = new FakeCache()
    cache = new TestableTweetResponseCache(fakeCache)
  })

  it('deletes entries past the TTL and keeps fresh ones', async () => {
    const expired = new Date(Date.now() - (CACHE_TIME + 60) * 1000)
    const fresh = new Date()

    await fakeCache.put(
      new Request('http://mediaharvest.local/tweets/expired'),
      makeResponseWithDate(expired.toUTCString())
    )
    await fakeCache.put(
      new Request('http://mediaharvest.local/tweets/fresh'),
      makeResponseWithDate(fresh.toUTCString())
    )

    const error = await cache.evictExpired()
    expect(error).toBeUndefined()

    const keys = await fakeCache.keys()
    const urls = keys.map(request => request.url)
    expect(urls).toContain('http://mediaharvest.local/tweets/fresh')
    expect(urls).not.toContain('http://mediaharvest.local/tweets/expired')
  })

  it('deletes entries without a parseable Date header', async () => {
    await fakeCache.put(
      new Request('http://mediaharvest.local/tweets/legacy'),
      new Response('{}')
    )

    const error = await cache.evictExpired()
    expect(error).toBeUndefined()

    const keys = await fakeCache.keys()
    expect(keys).toHaveLength(0)
  })
})
