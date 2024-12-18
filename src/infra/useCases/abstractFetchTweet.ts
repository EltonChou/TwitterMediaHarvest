import type { Factory } from '#domain/factories/base'
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
import { apply, flow, pipe } from 'fp-ts/function'
import Joi, { type ValidationResult } from 'joi'

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
  id: Joi.string().required(),
  hashtags: Joi.array().items(Joi.string()),
  createdAt: Joi.date().required(),
})

const tweetUserPropsSchema = Joi.object<TweetUserProps, true>({
  displayName: Joi.string(),
  screenName: Joi.string(),
  userId: Joi.string(),
})

export abstract class FetchTweetBase implements FetchTweet {
  abstract identity: string
  protected bearerToken =
    'AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA'

  abstract makeEndpoint(tweetId: string): string
  abstract makeHeaders(params: MakeHeaderParams): Headers

  protected parseBodyWithOptions(options: ParseOptions) {
    return (body: any): Result<Tweet> => {
      if (Object.hasOwn(body, 'errors')) return toErrorResult(new FetchTweetError(404))

      const getResultFromBody = (body: any) =>
        pipe(
          O.some<TimelineInstruction[]>(
            body?.data?.threaded_conversation_with_injections_v2?.instructions
          ),
          E.fromOption(() => 'Failed to get instructions'),
          E.chain(
            flow(
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
          E.chain(
            flow(
              A.filter(e => e.entryId.includes(options.targetTweetId)),
              A.head,
              E.fromOption(() => 'Failed to get entry')
            )
          ),
          E.chain(entry =>
            pipe(
              entry?.content?.itemContent?.tweet_results?.result.tweet ??
                entry?.content?.itemContent?.tweet_results?.result,
              E.fromNullable('Failed to get result')
            )
          )
        )

      const getTweetResultFromResult = (result: any) =>
        pipe(result?.legacy ?? result, E.fromNullable('Failed to get tweet result'))

      const getTweetPropsFromTweetResult = (tweetResult: any) =>
        pipe(
          tweetPartialPropsSchema.validate({
            id: tweetResult.rest_id ?? tweetResult.id_str,
            hashtags: parseHashtags(tweetResult?.entities),
            createdAt: new Date(tweetResult.created_at),
          }),
          validationResultToEither
        )

      const getUserPropsFromResult = (result: any) =>
        pipe(
          result?.core?.user_results?.result,
          E.fromNullable('Failed to get user result'),
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
          E.bind('result', () => getResultFromBody(body)),
          E.bind('tweetResult', payload => getTweetResultFromResult(payload.result)),
          E.bind('userProps', payload => getUserPropsFromResult(payload.result)),
          E.bind('mediaCollection', payload =>
            E.tryCatch(
              () => getMediaCollectionFromTweetResult(payload.tweetResult),
              e => E.toError(e).message ?? 'Failed to parse media collection'
            )
          ),
          E.bind('partialTweetProps', payload =>
            getTweetPropsFromTweetResult(payload.tweetResult)
          ),
          E.map(payload => ({
            user: new TweetUser(payload.userProps),
            ...payload.mediaCollection,
            ...payload.partialTweetProps,
          })),
          E.map(props => new Tweet(props)),
          E.mapLeft(r => new ParseTweetError(r)),
          E.match(toErrorResult, toSuccessResult)
        )

      return parseTweetFromBody(body)
    }
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
        TE.Do,
        TE.bind('quota', () =>
          pipe(
            resp.headers.get('X-Rate-Limit-Remaining'),
            O.fromNullable,
            O.orElse(() => O.some('0')),
            TE.fromOption(() => 'Failed to get rate limit remaining'),
            TE.mapLeft(E.toError),
            TE.map(Number.parseInt)
          )
        ),
        TE.bind('body', () => TE.tryCatch(() => resp.json(), E.toError)),
        TE.bind('tweet', ({ body }) =>
          pipe(
            this.parseBodyWithOptions,
            apply({ targetTweetId: command.tweetId }),
            apply(body),
            result => (result.error ? TE.left(result.error) : TE.right(result.value))
          )
        ),
        TE.map(
          ({ tweet, quota }) =>
            ({
              error: undefined,
              value: tweet,
              remainingQuota: quota,
            } satisfies TweetResult)
        )
      )

    const fetchTweet = pipe(
      callTweetApi,
      TE.chain(resp =>
        resp.status === 200 ? TE.right(resp) : TE.left(new FetchTweetError(resp.status))
      ),
      TE.flatMap(flow(parseResponse)),
      TE.match(flow(E.toError, errorToErrorTweetResult), r => r)
    )

    return fetchTweet()
  }
}

type MediaCollection = { images: TweetMedia[]; videos: TweetMedia[] }

const parseMedias = (entity: Record<string, unknown>): MediaCollection => {
  const medias = (entity?.media as Media[]) ?? []
  let imageIndex = 0
  let videoIndex = 0

  const increaseImageIdx = () => (imageIndex += 1)
  const increaseVideoIndex = () => (videoIndex += 1)

  return medias.reduce<MediaCollection>(
    (mediaCollection, media) => {
      mediaCollection.images.push(
        new TweetMedia({
          index: imageIndex,
          type: media.type === 'photo' ? 'photo' : 'thumbnail',
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
    }
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
  bitrate: 0
  content_type: 'application/x-mpegURL'
  url: string
}

type VideoVariant = Mp4Variant | MpegUrlVariant

type Media =
  | {
      type: 'photo'
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
      currVariant?.bitrate >= prevVariant?.bitrate ? currVariant : prevVariant
    ).url

const validationResultToEither = <T>(result: ValidationResult<T>): E.Either<string, T> =>
  result.error ? E.left(result.error.message) : E.right(result.value)

const errorToErrorTweetResult: Factory<Error, TweetResult> = error => ({
  error: error,
  remainingQuota: -1,
  value: undefined,
})
