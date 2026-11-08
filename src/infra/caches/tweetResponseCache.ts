/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import type { IExpirableCache } from '#domain/repositories/cache'
import type { ITweetCache } from '#domain/repositories/tweet'
import type { PropsOf } from '#domain/valueObjects/base'
import { Tweet } from '#domain/valueObjects/tweet'
import { TweetMedia } from '#domain/valueObjects/tweetMedia'
import { TweetUser } from '#domain/valueObjects/tweetUser'
import { TweetWithContent } from '#domain/valueObjects/tweetWithContent'
import { toErrorResult, toSuccessResult } from '#utils/result'
import Joi from 'joi'

const mediaPropsSchema: Joi.ObjectSchema<PropsOf<TweetMedia>> = Joi.object({
  index: Joi.number().required(),
  type: Joi.valid('photo', 'thumbnail', 'video').required(),
  url: Joi.string().required(),
  available: Joi.boolean().optional().default(true),
})

const userPropsSchema: Joi.ObjectSchema<PropsOf<TweetUser>> = Joi.object({
  isProtected: Joi.boolean().optional().default(false),
  displayName: Joi.string().required(),
  screenName: Joi.string().required(),
  userId: Joi.string().required(),
})

type TweetSchema = Omit<PropsOf<Tweet>, 'user' | 'images' | 'videos'> & {
  content: string
  user: PropsOf<TweetUser>
  images: PropsOf<TweetMedia>[]
  videos: PropsOf<TweetMedia>[]
}

const tweetPropsSchema: Joi.ObjectSchema<TweetSchema> = Joi.object({
  createdAt: Joi.date().required(),
  hashtags: Joi.array().items(Joi.string()).required(),
  id: Joi.string().required(),
  images: Joi.array().items(mediaPropsSchema).required(),
  videos: Joi.array().items(mediaPropsSchema).required(),
  user: userPropsSchema.required(),
})

const responseSchema: Joi.ObjectSchema<{
  tweet: TweetSchema
  content: string
}> = Joi.object({
  tweet: tweetPropsSchema.required(),
  content: Joi.string().required(),
})

const CACHE_TIME = 86400 as const // 24 hours
const CACHE_NAME = 'tweet-response' as const

export class TweetResponseCache
  implements ITweetCache, IExpirableCache<TweetWithContent>
{
  private cache?: Cache
  constructor() {}

  protected async getCache() {
    return (this.cache ??= await caches.open(CACHE_NAME))
  }

  /**
   * @param cacheId tweet id
   */
  async get(cacheId: string): AsyncResult<TweetWithContent | undefined, Error> {
    try {
      const cache = await this.getCache()
      const response = await cache.match(makeRequest(cacheId))
      if (!response) return toSuccessResult(undefined)

      const data = await response.json()

      const { value, error } = responseSchema.validate(data)
      if (error) return toErrorResult(error)

      const user = TweetUser.create({ ...value.tweet.user })

      const tweet = Tweet.create({
        ...value.tweet,
        videos: value.tweet.videos.map(TweetMedia.create),
        images: value.tweet.images.map(TweetMedia.create),
        user: user,
      })

      return toSuccessResult(
        TweetWithContent.create({
          tweet,
          content: value.content,
        })
      )
    } catch (error) {
      return toErrorResult(error as Error)
    }
  }

  async save(item: TweetWithContent): Promise<UnsafeTask> {
    try {
      const cache = await this.getCache()

      // Chromium's put deletes the existing entry before creating the new one,
      // so a failed put may lose it (read from source, not observed). Don't
      // risk a usable hit just to refresh it.
      // Source: PutImpl, PutDidDeleteEntry and PutDidCreateEntry in
      // https://chromium.googlesource.com/chromium/src/+/refs/tags/153.0.8010.55/content/browser/cache_storage/cache_storage_cache.cc
      // Unverified: DeleteImpl and its callbacks were only seen as a summary.
      const cached = await cache.match(makeRequest(item.id))
      if (cached && !isExpired(cached, Date.now())) return undefined

      const payload = JSON.stringify(item)
      const put = () => cache.put(makeRequest(item.id), makeResponse(payload))

      // Chromium's put returns kErrorExists for any OpenOrCreateEntry failure,
      // so "Entry already exists." may not mean the entry exists.
      // Source: PutDidCreateEntry in cache_storage_cache.cc (link above).
      // kErrorExists maps to that message with InvalidAccessError in
      // https://chromium.googlesource.com/chromium/src/+/refs/tags/153.0.8010.55/third_party/blink/renderer/modules/cache_storage/cache_storage_error.cc
      // Unverified: why the entry call fails.
      // ponytail: one blind retry, unproven against the real failure. Never
      // drop the cache here: downloads rely on its hits.
      await put().catch(put)
      return undefined
    } catch (error) {
      return error as Error
    }
  }

  async saveAll(...items: TweetWithContent[]): Promise<UnsafeTask> {
    if (items.length === 0) return
    const errors = await Promise.all(items.map(item => this.save(item)))
    if (errors.some(error => error))
      return new AggregateError(
        errors.filter(Boolean),
        'Failed to cache some tweet response'
      )
  }

  /**
   * Clean all cache by dropping the whole cache storage and invalidating the
   * cached handle so it gets reopened lazily on the next access.
   */
  async clean(): Promise<UnsafeTask> {
    try {
      await caches.delete(CACHE_NAME)
      this.cache = undefined
      return undefined
    } catch (error) {
      return error as Error
    }
  }

  async evictExpired(): Promise<UnsafeTask> {
    try {
      const cache = await this.getCache()
      const now = Date.now()
      const requests = await cache.keys()
      await Promise.all(
        requests.map(async request => {
          const response = await cache.match(request)
          if (!response || isExpired(response, now)) await cache.delete(request)
        })
      )
      return undefined
    } catch (error) {
      return error as Error
    }
  }
}

/**
 * Past TTL, or without a parseable timestamp (e.g. entries written before the
 * `Date` header was added).
 */
const isExpired = (response: Response, now: number): boolean => {
  const cachedAt = Date.parse(response.headers.get('Date') ?? '')
  return Number.isNaN(cachedAt) || now - cachedAt > CACHE_TIME * 1000
}

const makeRequest = (tweetId: string): Request => {
  return new Request(makeFakeTweetUrl(tweetId))
}

const makeFakeTweetUrl = (tweetId: string) =>
  `http://mediaharvest.local/tweets/${tweetId}`

const makeResponse = (payload: string) => {
  return new Response(payload, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': new TextEncoder()
        .encode(payload)
        .buffer.byteLength.toString(),
      'Cache-Control': `max-age=${CACHE_TIME}`,
      Date: new Date().toUTCString(),
    },
  })
}
