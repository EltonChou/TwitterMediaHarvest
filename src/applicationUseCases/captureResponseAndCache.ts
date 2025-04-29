/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import type { ICache } from '#domain/repositories/cache'
import type { AsyncUseCase } from '#domain/useCases/base'
import { TweetWithContent } from '#domain/valueObjects/tweetWithContent'
import {
  Instruction,
  isMediaTweet,
  isTimelineTimelineItem,
  isTimelineTimelineModule,
  isTimelineTweet,
} from '#libs/XApi/parsers/refinements'
import { parseTweet } from '#libs/XApi/parsers/tweet'
import { ResponseType } from '#libs/webExtMessage'
import { isErrorResult, toErrorResult, toSuccessResult } from '#utils/result'
import Joi from 'joi'

export interface CaptureResponseAndCacheCommand {
  type: ResponseType
  body: string
}

export interface InfraProvider {
  tweetResponseCache: ICache<TweetWithContent>
}

export class CaptureResponseAndCache
  implements AsyncUseCase<CaptureResponseAndCacheCommand, UnsafeTask>
{
  constructor(readonly infra: InfraProvider) {}

  protected async processUserTweetsResponse(body: string): Promise<UnsafeTask> {
    const jsonResult = parseJSON(body)
    if (isErrorResult(jsonResult)) return jsonResult.error

    const { value, error: schemaError } = userTweetsSchema.validate(
      jsonResult.value
    )
    if (schemaError) return schemaError

    const pinTweets = value.data.user.result.timeline.timeline.instructions
      .filter(Instruction.isTimelinePinEntry)
      .reduce<XApi.Tweet[]>((tweets, instruction) => {
        if (
          Instruction.isTimelinePinEntry(instruction) &&
          isTimelineTweet(instruction.entry.content.itemContent)
        )
          tweets.push(
            instruction.entry.content.itemContent.tweet_results.result
          )

        return tweets
      }, [])

    const tweets = value.data.user.result.timeline.timeline.instructions
      .filter(Instruction.isTimelineAddEntries)
      .reduce<XApi.TimelineAddEntry[]>((entries, instruction) => {
        return entries.concat(instruction.entries)
      }, [])
      .reduce<XApi.Tweet[]>((tweets, entry) => {
        if (
          isTimelineTimelineItem(entry.content) &&
          isTimelineTweet(entry.content.itemContent)
        ) {
          tweets.push(entry.content.itemContent.tweet_results.result)
        }
        return tweets
      }, [])

    return this.infra.tweetResponseCache.saveAll(
      ...pinTweets.concat(tweets).map(parseTweet)
    )
  }

  protected async processRestTweetByIdResponse(
    body: string
  ): Promise<UnsafeTask> {
    const jsonResult = parseJSON(body)
    if (isErrorResult(jsonResult)) return jsonResult.error

    const { value, error: schemaError } = restBodySchema.validate(
      jsonResult.value
    )
    if (schemaError) return schemaError

    const tweet = value.data.tweetResult.result
    if (!isMediaTweet(tweet)) return

    // eslint-disable-next-line no-console
    if (__DEV__) console.debug('Cache tweet response')

    return this.infra.tweetResponseCache.save(parseTweet(tweet))
  }

  protected async processTweetDetailResponse(
    body: string
  ): Promise<UnsafeTask> {
    const jsonResult = parseJSON(body)
    if (isErrorResult(jsonResult)) return jsonResult.error

    const { value, error: schemaError } = detailBodySchema.validate(
      jsonResult.value
    )
    if (schemaError) return schemaError

    const instructions =
      value.data.threaded_conversation_with_injections_v2.instructions

    const tweets = instructions
      .reduce<XApi.TimelineAddEntry[]>(
        (entries, instruction) =>
          Instruction.isTimelineAddEntries(instruction)
            ? entries.concat(instruction.entries)
            : entries,
        []
      )
      .reduce<XApi.Tweet[]>((tweets, { content: entryContent }) => {
        if (
          isTimelineTimelineItem(entryContent) &&
          isTimelineTweet(entryContent.itemContent)
        )
          tweets.push(entryContent.itemContent.tweet_results.result)

        if (isTimelineTimelineModule(entryContent))
          entryContent.items
            .map(threadItem => threadItem.item.itemContent)
            .filter(isTimelineTweet)
            .forEach(itemContent =>
              tweets.push(itemContent.tweet_results.result)
            )

        return tweets
      }, [])

    return this.infra.tweetResponseCache.saveAll(
      ...tweets.filter(isMediaTweet).map(parseTweet)
    )
  }

  async process({
    type,
    body,
  }: CaptureResponseAndCacheCommand): Promise<UnsafeTask<Error>> {
    let error: UnsafeTask = undefined
    // eslint-disable-next-line no-console
    if (__DEV__) console.debug('Cache tweet response')

    if (type === ResponseType.TweetDetail) {
      error = await this.processTweetDetailResponse(body)
    } else if (type === ResponseType.TweetResultByRestId) {
      error = await this.processRestTweetByIdResponse(body)
    } else if (type === ResponseType.UserTweets) {
      error = await this.processUserTweetsResponse(body)
    }

    if (error) {
      // eslint-disable-next-line no-console
      console.error(error)
    }

    return error
  }
}

const parseJSON = (body: string) => {
  try {
    const content = JSON.parse(body)
    return toSuccessResult(content)
  } catch (error) {
    return toErrorResult(error as Error)
  }
}

const detailBodySchema: Joi.ObjectSchema<XApi.TweetDetailBody> = Joi.object({
  data: Joi.object({
    threaded_conversation_with_injections_v2: Joi.object({
      instructions: Joi.array().required(),
    })
      .required()
      .unknown(true),
  })
    .required()
    .unknown(true),
})

const restBodySchema: Joi.ObjectSchema<XApi.TweetByRestIdBody> = Joi.object({
  data: Joi.object({
    tweetResult: Joi.object({
      result: Joi.object().required().unknown(true),
    })
      .required()
      .unknown(true),
  })
    .required()
    .unknown(true),
})

const userTweetsSchema: Joi.ObjectSchema<XApi.UserTweetsBody> = Joi.object({
  data: Joi.object({
    user: Joi.object({
      result: Joi.object({
        __typename: Joi.valid('User').required(),
      })
        .unknown(true)
        .required(),
    })
      .required()
      .unknown(true),
  })
    .required()
    .unknown(true),
})
