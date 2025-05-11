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
  eagerParseTweet,
  parseTweet,
  retrieveTweetFromTweetResult,
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

  protected cacheTweets(tweet: TweetWithContent | TweetWithContent[]) {
    const isMultiple = Array.isArray(tweet)

    if (__DEV__)
      // eslint-disable-next-line no-console
      console.debug(
        `Cache ${isMultiple ? tweet.length : 1} tweet${isMultiple && tweet.length > 1 ? 's' : ''}`
      )

    if (isMultiple) return this.infra.tweetResponseCache.saveAll(...tweet)
    return this.infra.tweetResponseCache.save(tweet)
  }

  protected async processUserTimelineResponse(
    body: string
  ): Promise<UnsafeTask> {
    const { value, error: schemaError } = validateBody(body, userTweetsSchema)
    if (schemaError) return schemaError

    const mediaTweets = retriveMediaTweetsFromInstructions(
      value.data.user.result.timeline.timeline.instructions
    )

    return this.cacheTweets(mediaTweets)
  }

  protected async processRestTweetByIdResponse(
    body: string
  ): Promise<UnsafeTask> {
    const { value, error: schemaError } = validateBody(body, restBodySchema)
    if (schemaError) return schemaError

    const result = retrieveTweetFromTweetResult(value.data.tweetResult)
    if (isErrorResult(result)) return
    if (!isMediaTweet(result.value)) return

    return this.cacheTweets(parseTweet(result.value))
  }

  protected async processTweetDetailResponse(
    body: string
  ): Promise<UnsafeTask> {
    const { value, error: schemaError } = validateBody(body, detailBodySchema)
    if (schemaError) return schemaError

    const mediaTweets = retriveMediaTweetsFromInstructions(
      value.data.threaded_conversation_with_injections_v2.instructions
    )

    return this.cacheTweets(mediaTweets)
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

    return this.cacheTweets(mediaTweets)
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

    return this.cacheTweets(mediaTweets)
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

    return this.cacheTweets(mediaTweets)
  }

  protected async processListTimelineResponse(body: string) {
    const { value, error: schemaError } = validateBody(
      body,
      listTimelineBodySchema
    )
    if (schemaError) return schemaError

    const mediaTweets = retriveMediaTweetsFromInstructions(
      value.data.list.tweets_timeline.timeline.instructions
    )

    return this.cacheTweets(mediaTweets)
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
      case ResponseType.HomeLatestTimeline:
        error = await this.processHomeTimelineResponse(body)
        break

      case ResponseType.CommunitiesExploreTimeline:
        error = await this.processCommunitiesExploreTimelineResponse(body)
        break

      case ResponseType.Bookmarks:
        error = await this.processBookmarkTimelineResponse(body)
        break

      case ResponseType.ListLatestTweetsTimeline:
        error = await this.processListTimelineResponse(body)
        break

      default:
        // eslint-disable-next-line no-console
        if (__DEV__) console.debug(`Not implemented for ${type}`)
    }

    /* eslint-disable no-console */
    if (error) {
      if (error instanceof Joi.ValidationError) {
        console.group(`Invalid response body has been captured.`)
        console.warn(`Response type: ${type}`)
        console.warn(body)
        console.groupEnd()
      } else {
        console.error(error)
      }
    }
    /* eslint-enable no-console */

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

const listTimelineBodySchema: Joi.ObjectSchema<XApi.ListTimelineBody> =
  Joi.object({
    data: Joi.object({
      list: Joi.object({
        tweets_timeline: Joi.object({
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
  if (isErrorResult(jsonResult)) return jsonResult

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
    .map(eagerParseTweet)
    .flat()
}
