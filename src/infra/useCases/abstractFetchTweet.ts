import type {
  FetchTweet,
  FetchTweetCommand,
  TweetResult,
} from '#domain/useCases/fetchTweet'
import { FetchTweetError, ParseTweetError } from '#domain/useCases/fetchTweet'
import { Tweet, type TweetProps } from '#domain/valueObjects/tweet'
import { TweetMedia } from '#domain/valueObjects/tweetMedia'
import { TweetUser, type TweetUserProps } from '#domain/valueObjects/tweetUser'
import { toErrorResult, toSuccessResult } from '#utils/result'
import * as A from 'fp-ts/Array'
import * as E from 'fp-ts/Either'
import * as O from 'fp-ts/Option'
import * as TE from 'fp-ts/TaskEither'
import { pipe } from 'fp-ts/function'
import type { Task } from 'fp-ts/lib/Task'
import Joi, { ValidationResult } from 'joi'

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

const tweetPartialPropsSchema = Joi.object<
  Omit<TweetProps, 'user' | 'videos' | 'images'>
>({
  id: Joi.string(),
  hashtags: Joi.array().items(Joi.string()),
  createdAt: Joi.date(),
})

const tweetUserPropsSchema = Joi.object<TweetUserProps, true>({
  displayName: Joi.string(),
  screenName: Joi.string(),
  userId: Joi.string(),
})

export abstract class FetchTweetBase implements FetchTweet {
  protected bearerToken =
    'AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA'

  abstract makeEndpoint(tweetId: string): string
  abstract makeHeaders(params: MakeHeaderParams): Headers

  protected parseBody(body: any, options: ParseOptions): Result<Tweet> {
    if (Object.hasOwn(body, 'errors')) return toErrorResult(new FetchTweetError(404))

    const getResultFromBody = (body: any) =>
      pipe(
        body?.data?.threaded_conversation_with_injections_v2?.instructions as
          | undefined
          | TimelineInstruction[],
        O.fromNullable,
        E.fromOption(() => 'Failed to get instructions'),
        E.chain(instructions =>
          pipe(
            instructions,
            A.filter(i => i.type === 'TimelineAddEntries'),
            A.head,
            E.fromOption(() => 'Failed to get instruction')
          )
        ),
        E.chain(instruction =>
          Array.isArray(instruction.entries)
            ? E.right(instruction.entries)
            : E.left('Failed to get entries')
        ),
        E.chain(entries =>
          pipe(
            entries,
            A.filter(e => e.entryId.includes(options.targetTweetId)),
            A.head,
            E.fromOption(() => 'Failed to get entry')
          )
        ),
        E.chain(entry =>
          pipe(
            entry?.content?.itemContent?.tweet_results?.result.tweet ||
              entry?.content?.itemContent?.tweet_results?.result,
            O.fromNullable,
            E.fromOption(() => 'Failed to get result')
          )
        )
      )

    const getTweetResultFromResult = (result: any) =>
      pipe(
        result?.legacy ?? result,
        O.fromNullable,
        E.fromOption(() => 'Failed to get tweet result')
      )

    const getTweetPropsFromTweetResult = (tweetResult: any) =>
      pipe(
        tweetPartialPropsSchema.validate({
          id: tweetResult.rest_id,
          hashtags: parseHashtags(tweetResult?.entities),
          createdAt: new Date(tweetResult.createdAt),
        }),
        validationResultToEither
      )

    const getUserPropsFromResult = (result: any) =>
      pipe(
        result,
        E.chain(r =>
          pipe(
            result?.right.core?.user_results?.result,
            O.fromNullable,
            E.fromOption(() => 'Failed to get user result')
          )
        ),
        E.chain(userResult =>
          pipe(
            tweetUserPropsSchema.validate({
              displayName: userResult?.legacy?.name,
              screenName: userResult?.legacy?.screen_name,
              userId: userResult?.rest_id,
            }),
            validationResultToEither
          )
        )
      )

    const getMediaCollectionFromTweetResult = (tweetResult: any) =>
      pipe(tweetResult?.extended_entities ?? [], parseMedias)

    const parseTweetFromBody = (body: any): Result<Tweet> =>
      pipe(
        E.Do,
        E.chain(payload =>
          pipe(
            body,
            getResultFromBody,
            E.chain(result => E.right({ ...payload, result }))
          )
        ),
        E.chain(payload =>
          pipe(
            payload.result,
            getTweetResultFromResult,
            E.chain(tweetResult => E.right({ ...payload, tweetResult }))
          )
        ),
        E.chain(payload =>
          pipe(
            payload.result,
            getUserPropsFromResult,
            E.chain(userProps => E.right({ ...payload, userProps }))
          )
        ),
        E.chain(payload =>
          pipe(
            payload.tweetResult,
            getTweetPropsFromTweetResult,
            E.chain(tweetProps => E.right({ ...payload, tweetProps }))
          )
        ),
        E.chain(payload => {
          const tweet = new Tweet({
            user: new TweetUser(payload.userProps),
            ...getMediaCollectionFromTweetResult(payload.tweetResult),
            ...payload.tweetProps,
          })
          return E.right(tweet)
        }),
        E.mapLeft(r => new ParseTweetError(r)),
        E.match(toErrorResult, toSuccessResult)
      )

    return parseTweetFromBody(body)
  }

  async process(command: FetchTweetCommand): Promise<TweetResult> {
    const callTweetApi = TE.tryCatch(
      () =>
        fetch(this.makeEndpoint(command.tweetId), {
          method: 'GET',
          headers: this.makeHeaders({
            bearerToken: this.bearerToken,
            csrfToken: command.csrfToken,
          }),
          mode: 'cors',
          referrer: `https://x.com/i/web/status/${command.tweetId}`,
        }),
      E.toError
    )

    const parseResponse = (resp: Response) =>
      pipe(
        TE.tryCatch(() => resp.json(), E.toError),
        TE.chain(body =>
          TE.right(this.parseBody(body, { targetTweetId: command.tweetId }))
        ),
        TE.map(
          r =>
            ({
              ...r,
              remainingQuota: Number(resp.headers.get('X-Rate-Limit-Remaining') ?? 0),
            } as TweetResult)
        )
      )

    const fetchTweet: Task<TweetResult> = pipe(
      callTweetApi,
      TE.chain(resp =>
        resp.status === 200 ? TE.right(resp) : TE.left(new FetchTweetError(resp.status))
      ),
      TE.chain(parseResponse),
      TE.match(
        err => ({ value: undefined, remainingQuota: -1, error: err }),
        r => r
      )
    )

    return fetchTweet()
  }
}

type MediaCollection = { images: TweetMedia[]; videos: TweetMedia[] }

const parseMedias = (entity: Record<string, unknown>): MediaCollection => {
  const medias = (entity?.medias as Media[]) ?? []
  let imageIndex = 0
  let videoIndex = 0

  const increaseImageIdx = () => (imageIndex += 1)
  const increaseVideoIndex = () => (videoIndex += 1)

  return medias.reduce(
    (mediaCollection, media) => {
      mediaCollection.images.push(
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
          mediaCollection.videos.push(
            new TweetMedia({
              index: videoIndex,
              type: 'video',
              url: url,
            })
          )
          increaseVideoIndex()
        }
      }

      return mediaCollection
    },
    {
      images: [],
      videos: [],
    } as MediaCollection
  )
}

type Hashtag = {
  text: string
}

const parseHashtags = (entity: Record<string, unknown>): string[] =>
  ((entity?.hashtags as Hashtag[]) ?? []).map(v => v.text)

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

const validationResultToEither = <T>(result: ValidationResult<T>): E.Either<string, T> =>
  result.error ? E.left(result.error.message) : E.right(result.value)