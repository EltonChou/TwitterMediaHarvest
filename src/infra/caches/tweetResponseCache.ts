/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import type { ICache } from '#domain/repositories/cache'
import type { PropsOf } from '#domain/valueObjects/base'
import { Tweet } from '#domain/valueObjects/tweet'
import { TweetMedia } from '#domain/valueObjects/tweetMedia'
import { TweetUser } from '#domain/valueObjects/tweetUser'
import { TweetWithContent } from '#domain/valueObjects/tweetWithContent'
import { TimeHelper } from '#helpers/time'
import { toErrorResult, toSuccessResult } from '#utils/result'
import Joi from 'joi'

const mediaPropsSchema: Joi.ObjectSchema<PropsOf<TweetMedia>> = Joi.object({
  index: Joi.number().required(),
  type: Joi.valid('photo', 'thumbnail', 'video').required(),
  url: Joi.string().required(),
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

export class TweetResponseCache implements ICache<TweetWithContent> {
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

      const response = new Response(JSON.stringify(item), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': `max-age=${TimeHelper.hour(24)}`,
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
}

const makeFakeTweetUrl = (tweetId: string) =>
  `http://mediaharvest.local/tweets/${tweetId}`
