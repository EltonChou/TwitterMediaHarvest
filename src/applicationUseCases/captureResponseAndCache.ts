import type { ICache } from '#domain/repositories/cache'
import type { AsyncUseCase } from '#domain/useCases/base'
import { TweetWithContent } from '#domain/valueObjects/tweetWithContent'
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

    const mediaTweet = parseTweet(tweet)

    // eslint-disable-next-line no-console
    if (__DEV__) console.debug(mediaTweet)

    return this.infra.tweetResponseCache.save(mediaTweet)
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
          entryContent.items.forEach(threadItem =>
            tweets.push(threadItem.item.itemContent.tweet_results.result)
          )

        return tweets
      },
      []
    )

    const mediaTweets = tweets.filter(isMediaTweet).map(parseTweet)

    // eslint-disable-next-line no-console
    if (__DEV__) console.debug(mediaTweets)

    return this.infra.tweetResponseCache.saveAll(...mediaTweets)
  }

  async process({
    type,
    body,
  }: CaptureResponseAndCacheCommand): Promise<UnsafeTask<Error>> {
    if (type === ResponseType.TweetDetail)
      return this.processTweetDetailResponse(body)

    if (type === ResponseType.TweetResultByRestId)
      return this.processRestTweetByIdResponse(body)

    throw new Error('Method not implemented.')
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

const isTimelineAddEntries = (
  instruction: XApi.Instruction
): instruction is XApi.TimelineAddEntries =>
  instruction.type === 'TimelineAddEntries'

const isTimelineTimelineModule = (
  entryContent: XApi.EntryContent
): entryContent is XApi.TimelineTimelineModule =>
  entryContent.__typename === 'TimelineTimelineModule'

const isTimelineTimelineItem = (
  entryContent: XApi.EntryContent
): entryContent is XApi.TimelineTimelineItem =>
  entryContent.__typename === 'TimelineTimelineItem'

const isTimelineTweet = (
  timelineItemContent: XApi.TimelineItemContent
): timelineItemContent is XApi.TimelineTweet =>
  timelineItemContent.__typename === 'TimelineTweet'

const isMediaTweet = (tweet: XApi.Tweet): tweet is XApi.MediaTweet =>
  tweet.legacy['extended_entities'] !== undefined
