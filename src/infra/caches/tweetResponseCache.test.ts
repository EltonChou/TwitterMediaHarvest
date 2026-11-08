/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import type { TweetWithContent } from '#domain/valueObjects/tweetWithContent'
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

describe('TweetResponseCache.save', () => {
  const item = { id: '1' } as TweetWithContent
  const putError = new Error('Entry already exists.')

  it('retries a failed write once with a fresh response', async () => {
    const fakeCache = new FakeCache()
    const put = jest.spyOn(fakeCache, 'put').mockRejectedValueOnce(putError)
    const cache = new TestableTweetResponseCache(fakeCache)

    await expect(cache.save(item)).resolves.toBeUndefined()

    expect(put).toHaveBeenCalledTimes(2)
    expect(put.mock.calls[1]?.[1]).not.toBe(put.mock.calls[0]?.[1])
    expect(await fakeCache.keys()).toHaveLength(1)
  })

  it('returns the error when the retry fails too', async () => {
    const fakeCache = new FakeCache()
    const put = jest.spyOn(fakeCache, 'put').mockRejectedValue(putError)
    const cache = new TestableTweetResponseCache(fakeCache)

    await expect(cache.save(item)).resolves.toBe(putError)

    expect(put).toHaveBeenCalledTimes(2)
  })

  it('skips a tweet that is already cached and not expired', async () => {
    const fakeCache = new FakeCache()
    const request = new Request('http://mediaharvest.local/tweets/1')
    const cached = makeResponseWithDate(new Date().toUTCString())
    await fakeCache.put(request, cached)
    const put = jest.spyOn(fakeCache, 'put')
    const cache = new TestableTweetResponseCache(fakeCache)

    await expect(cache.save(item)).resolves.toBeUndefined()

    expect(put).not.toHaveBeenCalled()
    expect(await fakeCache.match(request)).toBe(cached)
  })

  it.each([
    [
      'expired',
      makeResponseWithDate(
        new Date(Date.now() - (CACHE_TIME + 60) * 1000).toUTCString()
      ),
    ],
    ['undated', new Response('{}')],
  ])('overwrites an %s entry', async (_, stale) => {
    const fakeCache = new FakeCache()
    const request = new Request('http://mediaharvest.local/tweets/1')
    await fakeCache.put(request, stale)
    const cache = new TestableTweetResponseCache(fakeCache)

    await expect(cache.save(item)).resolves.toBeUndefined()

    expect(await fakeCache.match(request)).not.toBe(stale)
  })
})

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
