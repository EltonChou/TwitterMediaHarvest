/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import type { ICache } from '#domain/repositories/cache'
import type { AsyncUseCase } from '#domain/useCases/base'
import { TweetWithContent } from '#domain/valueObjects/tweetWithContent'
import {
  isMediaTweet,
  isTimelineAddEntries,
  isTimelineTimelineItem,
  isTimelineTimelineModule,
  isTimelineTweet,
} from '#libs/XApi/parsers/refinement'
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

    // There might be multiple same instruction, but we take first one for now.
    const [timelineAddEntries] = instructions.filter(isTimelineAddEntries)
    if (!timelineAddEntries) return

    const entryContents = timelineAddEntries.entries.reduce<
      Array<
        | XApi.EntryContent
        | XApi.TimelineTimelineItem
        | XApi.TimelineTimelineModule
      >
    >((contents, entry) => {
      contents.push(entry.content)
      return contents
    }, [])

    const tweets = entryContents.reduce<XApi.Tweet[]>(
      (tweets, entryContent) => {
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
      },
      []
    )

    // eslint-disable-next-line no-console
    if (__DEV__) console.debug('Cache tweet response')

    return this.infra.tweetResponseCache.saveAll(
      ...tweets.filter(isMediaTweet).map(parseTweet)
    )
  }

  async process({
    type,
    body,
  }: CaptureResponseAndCacheCommand): Promise<UnsafeTask<Error>> {
    let error: UnsafeTask = undefined
    if (type === ResponseType.TweetDetail) {
      error = await this.processTweetDetailResponse(body)
    } else if (type === ResponseType.TweetResultByRestId) {
      error = await this.processRestTweetByIdResponse(body)
    }

    // eslint-disable-next-line no-console
    if (error) console.error(error)

    throw new Error(`Method not implemented for ${type}.`)
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
