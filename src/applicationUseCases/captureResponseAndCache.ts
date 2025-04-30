/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import type { ICache } from '#domain/repositories/cache'
import type { AsyncUseCase } from '#domain/useCases/base'
import { TweetWithContent } from '#domain/valueObjects/tweetWithContent'
import { isMediaTweet } from '#libs/XApi/parsers/refinements'
import {
  parseTweet,
  retrieveTweetsFromInstruction,
} from '#libs/XApi/parsers/tweet'
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

  protected retriveMediaTweetsFromInstructions(
    instructions: XApi.Instruction[]
  ) {
    return instructions
      .reduce<XApi.Tweet[]>(
        (tweets, instruction) =>
          tweets.concat(retrieveTweetsFromInstruction(instruction)),
        []
      )
      .filter(isMediaTweet)
      .map(parseTweet)
  }

  protected async processUserMediaResponse(body: string): Promise<UnsafeTask> {
    return this.processUserTweetsResponse(body)
  }

  protected async processUserTweetsResponse(body: string): Promise<UnsafeTask> {
    const jsonResult = parseJSON(body)
    if (isErrorResult(jsonResult)) return jsonResult.error

    const { value, error: schemaError } = userTweetsSchema.validate(
      jsonResult.value
    )
    if (schemaError) return schemaError

    const mediaTweets = this.retriveMediaTweetsFromInstructions(
      value.data.user.result.timeline.timeline.instructions
    )

    return this.infra.tweetResponseCache.saveAll(...mediaTweets)
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

    const mediaTweets = this.retriveMediaTweetsFromInstructions(
      value.data.threaded_conversation_with_injections_v2.instructions
    )

    return this.infra.tweetResponseCache.saveAll(...mediaTweets)
  }

  async process({
    type,
    body,
  }: CaptureResponseAndCacheCommand): Promise<UnsafeTask<Error>> {
    let error: UnsafeTask = undefined
    // eslint-disable-next-line no-console
    if (__DEV__) console.debug(`Cache tweet response ${type}`)

    if (type === ResponseType.TweetDetail) {
      error = await this.processTweetDetailResponse(body)
    } else if (type === ResponseType.TweetResultByRestId) {
      error = await this.processRestTweetByIdResponse(body)
    } else if (type === ResponseType.UserTweets) {
      error = await this.processUserTweetsResponse(body)
    } else if (type === ResponseType.UserMedia) {
      error = await this.processUserMediaResponse(body)
    } else {
      // eslint-disable-next-line no-console
      if (__DEV__) console.debug(`Not implemented for ${type}`)
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
