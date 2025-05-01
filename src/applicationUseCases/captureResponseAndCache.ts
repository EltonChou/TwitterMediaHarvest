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

  protected async processUserTimelineResponse(
    body: string
  ): Promise<UnsafeTask> {
    const { value, error: schemaError } = validateBody(body, userTweetsSchema)
    if (schemaError) return schemaError

    const mediaTweets = retriveMediaTweetsFromInstructions(
      value.data.user.result.timeline.timeline.instructions
    )

    return this.infra.tweetResponseCache.saveAll(...mediaTweets)
  }

  protected async processRestTweetByIdResponse(
    body: string
  ): Promise<UnsafeTask> {
    const { value, error: schemaError } = validateBody(body, restBodySchema)
    if (schemaError) return schemaError

    const tweet = value.data.tweetResult.result
    if (!isMediaTweet(tweet)) return

    return this.infra.tweetResponseCache.save(parseTweet(tweet))
  }

  protected async processTweetDetailResponse(
    body: string
  ): Promise<UnsafeTask> {
    const { value, error: schemaError } = validateBody(body, detailBodySchema)
    if (schemaError) return schemaError

    const mediaTweets = retriveMediaTweetsFromInstructions(
      value.data.threaded_conversation_with_injections_v2.instructions
    )

    return this.infra.tweetResponseCache.saveAll(...mediaTweets)
  }

  protected async processHomeTimelineResponse(
    body: string
  ): Promise<UnsafeTask> {
    const { value, error: schemaError } = validateBody(
      body,
      homeTimelineBodySchema
    )
    if (schemaError) return schemaError

    const mediaTweets = retriveMediaTweetsFromInstructions(
      value.data.home.home_timeline_urt.instructions
    )

    return this.infra.tweetResponseCache.saveAll(...mediaTweets)
  }

  protected async processBookmarkTimelineResponse(
    body: string
  ): Promise<UnsafeTask> {
    const { value, error: schemaError } = validateBody(
      body,
      bookmarkTimelineBodySchema
    )
    if (schemaError) return schemaError

    const mediaTweets = retriveMediaTweetsFromInstructions(
      value.data.bookmark_timeline_v2.timeline.instructions
    )

    return this.infra.tweetResponseCache.saveAll(...mediaTweets)
  }

  protected async processCommunitiesExploreTimelineResponse(
    body: string
  ): Promise<UnsafeTask> {
    const { value, error: schemaError } = validateBody(
      body,
      communitiesExploreTimelineBody
    )
    if (schemaError) return schemaError

    const mediaTweets = retriveMediaTweetsFromInstructions(
      value.data.viewer.explore_communities_timeline.timeline.instructions
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

    switch (type) {
      case ResponseType.TweetDetail:
        error = await this.processTweetDetailResponse(body)
        break

      case ResponseType.TweetResultByRestId:
        error = await this.processRestTweetByIdResponse(body)
        break

      case ResponseType.UserTweets:
      case ResponseType.UserArticlesTweets:
      case ResponseType.UserHighlightsTweets:
      case ResponseType.UserTweetsAndReplies:
      case ResponseType.UserMedia:
      case ResponseType.Likes:
        error = await this.processUserTimelineResponse(body)
        break

      case ResponseType.HomeTimeline:
        error = await this.processHomeTimelineResponse(body)
        break

      case ResponseType.CommunitiesExploreTimeline:
        error = await this.processCommunitiesExploreTimelineResponse(body)
        break

      case ResponseType.Bookmarks:
        error = await this.processBookmarkTimelineResponse(body)
        break

      default:
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

const userTweetsSchema: Joi.ObjectSchema<XApi.UserTimelineBody> = Joi.object({
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

const homeTimelineBodySchema: Joi.ObjectSchema<XApi.HomeTimelineBody> =
  Joi.object({
    data: Joi.object({
      home: Joi.object({
        home_timeline_urt: Joi.object({
          instructions: Joi.array().required(),
        })
          .required()
          .unknown(true),
      })
        .required()
        .unknown(true),
    })
      .unknown(true)
      .required(),
  }).unknown(true)

const bookmarkTimelineBodySchema: Joi.ObjectSchema<XApi.BookmarkTimelineBody> =
  Joi.object({
    data: Joi.object({
      bookmark_timeline_v2: Joi.object({
        timeline: Joi.object({
          instructions: Joi.array().required(),
        })
          .required()
          .unknown(true),
      })
        .required()
        .unknown(true),
    })
      .required()
      .unknown(true),
  }).unknown(true)

const communitiesExploreTimelineBody: Joi.ObjectSchema<XApi.CommunitiesExploreTimelineBody> =
  Joi.object({
    data: Joi.object({
      viewer: Joi.object({
        explore_communities_timeline: Joi.object({
          timeline: Joi.object({
            instructions: Joi.array().required(),
          })
            .required()
            .unknown(true),
        }),
      }),
    })
      .required()
      .unknown(true),
  }).unknown(true)

function validateBody<T>(body: string, schema: Joi.ObjectSchema<T>): Result<T> {
  const jsonResult = parseJSON(body)
  if (isErrorResult(jsonResult)) return toErrorResult(jsonResult.error)

  const { value, error: schemaError } = schema.validate(jsonResult.value)
  if (schemaError) return toErrorResult(schemaError)

  return toSuccessResult(value)
}

function retriveMediaTweetsFromInstructions(instructions: XApi.Instruction[]) {
  return instructions
    .reduce<XApi.Tweet[]>(
      (tweets, instruction) =>
        tweets.concat(retrieveTweetsFromInstruction(instruction)),
      []
    )
    .filter(isMediaTweet)
    .map(parseTweet)
}
