import type { FetchTweet, FetchTweetCommand } from '#domain/useCases/fetchTweet'
import { FetchTweetError, ParseTweetError } from '#domain/useCases/fetchTweet'
import { Tweet, type TweetProps } from '#domain/valueObjects/tweet'
import { TweetMedia } from '#domain/valueObjects/tweetMedia'
import { TweetUser, type TweetUserProps } from '#domain/valueObjects/tweetUser'
import * as A from 'fp-ts/Array'
import * as O from 'fp-ts/Option'
import { pipe } from 'fp-ts/function'
import Joi from 'joi'

type ParseOptions = {
  targetTweetId: string
}

type TimelineInstruction = {
  type: 'TimelineAddEntries'
  entries?: InstructionEntry[]
}

type InstructionEntry = {
  entryId: string
  content: any
}

export type MakeHeaderParams = {
  bearerToken: string
  csrfToken: string
}

const tweetPropsSchema: Joi.Schema<TweetProps> = Joi.object<TweetProps>({
  id: Joi.string(),
  isProtected: Joi.boolean(),
  hashtags: Joi.array().items(Joi.string()),
  createdAt: Joi.date(),
})
const tweetUserPropsSchema: Joi.Schema<TweetUserProps> = Joi.object<TweetUserProps, true>(
  {
    displayName: Joi.string(),
    screenName: Joi.string(),
    userId: Joi.string(),
    isProtected: Joi.boolean(),
  }
)

export abstract class FetchTweetBase implements FetchTweet {
  protected bearerToken =
    'AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA'

  abstract makeEndpoint(tweetId: string): string
  abstract makeHeaders(params: MakeHeaderParams): Headers

  protected parseBody(body: any, options: ParseOptions): Result<Tweet> {
    if (Object.hasOwn(body, 'errors'))
      return { error: new FetchTweetError(404), value: undefined }

    const instructions: TimelineInstruction[] =
      body?.data?.threaded_conversation_with_injections_v2?.instructions

    if (!Array.isArray(instructions))
      return {
        error: new ParseTweetError('Failed to get instructions'),
        value: undefined,
      }

    const instruction: TimelineInstruction = pipe(
      instructions,
      A.filter(i => i.type === 'TimelineAddEntries'),
      A.head,
      O.toUndefined
    )

    if (!instruction)
      return {
        error: new ParseTweetError('Failed to get instruction'),
        value: undefined,
      }

    const entries = instruction?.entries
    if (!Array.isArray(entries))
      return {
        error: new ParseTweetError('Failed to get entries'),
        value: undefined,
      }

    const entry = pipe(
      entries,
      A.filter(e => e.entryId.includes(options.targetTweetId)),
      A.head,
      O.toUndefined
    )

    if (!entry)
      return {
        error: new ParseTweetError('Failed to get entry'),
        value: undefined,
      }

    const result =
      entry.content.itemContent.tweet_results.result.tweet ||
      entry.content.itemContent.tweet_results.result

    if (!result)
      return {
        error: new ParseTweetError('Failed to get result'),
        value: undefined,
      }

    const tweetResult = result?.legacy ?? result
    if (!tweetResult)
      return {
        error: new ParseTweetError('Failed to get tweet result'),
        value: undefined,
      }

    const userResult = result?.core?.user_results?.result
    if (!userResult)
      return {
        error: new ParseTweetError('Failed to get user result'),
        value: undefined,
      }

    const { value: userProps, error: userPropsError } = tweetUserPropsSchema.validate({
      displayName: userResult?.legacy?.name,
      isProtected: Boolean(userResult?.legacy?.protected),
      screenName: userResult?.legacy?.screen_name,
      userId: userResult?.rest_id,
    })
    if (userPropsError)
      return { error: new ParseTweetError(userPropsError.message), value: undefined }

    const medias = parseMedias(tweetResult?.extended_entities ?? [])
    const { value: tweetProps, error: tweetPropsError } = tweetPropsSchema.validate({
      id: tweetResult.rest_id,
      isProtected: Boolean(tweetResult?.limited_actions),
      hashtags: parseHashtags(tweetResult?.entities),
      createdAt: new Date(tweetResult.createdAt),
    })
    if (tweetPropsError)
      return { error: new ParseTweetError(tweetPropsError.message), value: undefined }

    const tweet = new Tweet({
      ...tweetProps,
      user: new TweetUser(userProps),
      medias: medias,
    })

    return {
      value: tweet,
      error: undefined,
    }
  }

  async process(command: FetchTweetCommand): Promise<Result<Tweet>> {
    try {
      const resp = await fetch(this.makeEndpoint(command.tweetId), {
        method: 'GET',
        headers: this.makeHeaders({
          bearerToken: this.bearerToken,
          csrfToken: command.csrfToken,
        }),
        mode: 'cors',
        referrer: `https://x.com/i/web/status/${command.tweetId}`,
      })

      if (resp.status === 200) {
        const body = await resp.json()
        return this.parseBody(body, { targetTweetId: command.tweetId })
      }

      return {
        error: new FetchTweetError(resp.status),
        value: undefined,
      }
    } catch (error) {
      return {
        error: error,
        value: undefined,
      }
    }
  }
}

const parseMedias = (entity: Record<string, unknown>) => {
  const mediaFiles: TweetMedia[] = []
  const medias = (entity?.medias as Media[]) ?? []
  let imageIndex = 0
  let videoIndex = 0

  const increaseImageIdx = () => (imageIndex += 1)
  const increaseVideoIndex = () => (videoIndex += 1)

  return medias.reduce((mediaArray, media) => {
    mediaArray.push(
      new TweetMedia({
        index: imageIndex,
        type: media.type === 'image' ? 'image' : 'thumbnail',
        url: media.media_url_https,
      })
    )
    increaseImageIdx()

    if (media.type === 'animated_gif' || media.type === 'video') {
      const url = parseBestVideoVariant(media.video_info.variants)
      if (url) {
        mediaFiles.push(
          new TweetMedia({
            index: videoIndex,
            type: 'video',
            url: url,
          })
        )
        increaseVideoIndex()
      }
    }

    return mediaArray
  }, [] as TweetMedia[])
}

type Hashtag = {
  text: string
}

const parseHashtags = (entity: Record<string, unknown>): string[] =>
  (entity?.hashtags as Hashtag[]) ?? [].map(v => v.text)

type Mp4Variant = {
  bitrate: number
  content_type: 'video/mp4'
  url: string
}

type MpegUrlVariant = {
  content_type: 'application/x-mpegURL'
  url: string
}

type VideoVariant = Mp4Variant | MpegUrlVariant

type Media =
  | {
      type: 'image'
      media_url_https: string
    }
  | {
      type: 'video' | 'animated_gif'
      media_url_https: string
      video_info: {
        variants: VideoVariant[]
      }
    }

const parseBestVideoVariant = (variants: VideoVariant[]): string | undefined =>
  variants
    .filter(variant => variant.content_type === 'video/mp4')
    .reduce((prevVariant, currVariant) =>
      currVariant.bitrate >= prevVariant.bitrate ? currVariant : prevVariant
    ).url
