/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { ITweetCache } from '#domain/repositories/tweet'
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

export class TweetResponseCache implements ITweetCache {
  private cache?: Cache
  constructor() {}

  protected async getCache() {
    return (this.cache ??= await caches.open('tweet-response'))
  }

  /**
   * @param cacheId tweet id
   */
  async get(cacheId: string): AsyncResult<TweetWithContent | undefined, Error> {
    try {
      const cache = await this.getCache()
      const fakeRequest = new Request(makeFakeTweetUrl(cacheId))

      const response = await cache.match(fakeRequest)
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
      const request = new Request(makeFakeTweetUrl(item.id))

      const payload = JSON.stringify(item)
      const response = new Response(payload, {
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': new TextEncoder()
            .encode(payload)
            .buffer.byteLength.toString(),
          'Cache-Control': `max-age=${CACHE_TIME}`,
        },
      })

      await cache.put(request, response)
      return undefined
    } catch (error) {
      return error as Error
    }
  }

  async saveAll(...items: TweetWithContent[]): Promise<UnsafeTask> {
    if (items.length === 0) return
    const errors = await Promise.all(items.map(item => this.save(item)))
    if (errors.some(error => error))
      return new Error('Failed to cache some tweet response', { cause: errors })
  }

  /**
   * Try to clean all cache
   */
  async clean(): Promise<UnsafeTask> {
    try {
      const cache = await this.getCache()
      const keys = await cache.keys()
      const result = await Promise.allSettled(
        keys.map(key => cache.delete(key))
      )

      const stats = result.reduce(
        (stat, result) => {
          if (__DEV__ && result.status === 'rejected') {
            const log =
              // eslint-disable-next-line no-console
              result.reason instanceof Error ? console.error : console.debug

            log(result.reason)
          }

          return {
            success:
              stat.success +
              (result.status === 'fulfilled' && result.value ? 1 : 0),
            failed:
              stat.failed +
              (result.status === 'rejected' ||
              (result.status === 'fulfilled' && !result.value)
                ? 0
                : 1),
          }
        },
        { success: 0, failed: 0 }
      )

      // eslint-disable-next-line no-console
      if (__DEV__) console.debug('Cache clean stats:', JSON.stringify(stats))

      return undefined
    } catch (error) {
      return error as Error
    }
  }
}

const makeFakeTweetUrl = (tweetId: string) =>
  `http://mediaharvest.local/tweets/${tweetId}`
