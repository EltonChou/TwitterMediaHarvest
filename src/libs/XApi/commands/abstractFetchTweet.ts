import { Tweet, type TweetProps } from '#domain/valueObjects/tweet'
import { TweetMedia } from '#domain/valueObjects/tweetMedia'
import { TweetUser, type TweetUserProps } from '#domain/valueObjects/tweetUser'
import { toErrorResult, toSuccessResult } from '#utils/result'
import { GraphQLCommand, Query } from './graphql'
import { HttpMethod } from './types'
import type {
  CacheAble,
  Command,
  CommandCache,
  MetadataBearer,
  RequestContext,
  ResponseMetadata,
} from './types'
import * as A from 'fp-ts/Array'
import * as E from 'fp-ts/Either'
import * as O from 'fp-ts/Option'
import { flow, pipe } from 'fp-ts/function'
import Joi, { type ValidationResult } from 'joi'

export interface FetchTweetCommandInput extends LiteralObject {
  csrfToken: string
  tweetId: string
  cacheProvider: CommandCache | Provider<CommandCache>
}

// TODO: Should we isolate tweet object?
export interface FetchTweetCommandOutput extends MetadataBearer {
  tweetResult: Result<Tweet>
}

type TimelineInstruction = {
  type: 'TimelineAddEntries'
  entries?: InstructionEntry[]
}

type InstructionEntry = {
  entryId: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  content: any
}

const tweetPartialPropsSchema = Joi.object<
  Omit<TweetProps, 'user' | 'videos' | 'images'>
>({
  id: Joi.string().required(),
  hashtags: Joi.array().items(Joi.string()).required(),
  createdAt: Joi.date().required().required(),
})

const tweetUserPropsSchema = Joi.object<TweetUserProps, true>({
  displayName: Joi.string().required(),
  screenName: Joi.string().required(),
  userId: Joi.string().required(),
  isProtected: Joi.boolean().default(false),
})

export abstract class FetchTweetCommand
  extends GraphQLCommand
  implements Command<FetchTweetCommandInput, FetchTweetCommandOutput>, CacheAble
{
  readonly isCacheAble = true
  readonly method = HttpMethod.Get
  readonly config: FetchTweetCommandInput
  private cache: CommandCache | undefined = undefined

  constructor(config: FetchTweetCommandInput, query: Query) {
    super(query)
    this.config = config
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected getResultFromBody(body: any) {
    return pipe(
      body?.data?.threaded_conversation_with_injections_v2?.instructions,
      O.fromNullable<TimelineInstruction[]>,
      E.fromOption(() => 'Failed to get instructions'),
      E.chain(
        flow(
          A.filter(i => i.type === 'TimelineAddEntries'),
          A.head,
          E.fromOption(() => 'Failed to get `TimelineAddEntries` sinstruction')
        )
      ),
      E.chain(instruction =>
        Array.isArray(instruction.entries)
          ? E.right(instruction.entries)
          : E.left('Failed to get entries')
      ),
      E.chain(
        flow(
          A.filter(e => e.entryId.includes(this.config.tweetId)),
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
  }

  protected parseBody(body: unknown): Result<Tweet> {
    if (!body) {
      return hasErrorProperty(body)
        ? toErrorResult(
            new ParseTweetError(body.error ?? body.errors ?? 'Invalid body')
          )
        : toErrorResult(new ParseTweetError('Invalid body'))
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const getTweetResultFromResult = (result: any) =>
      pipe(
        result?.legacy ?? result,
        E.fromNullable('Failed to get tweet result')
      )

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const getTweetPropsFromTweetResult = (tweetResult: any) =>
      pipe(
        tweetPartialPropsSchema.validate({
          id: tweetResult.rest_id ?? tweetResult.id_str,
          hashtags: parseHashtags(tweetResult?.entities),
          createdAt: new Date(tweetResult.created_at),
        }),
        validationResultToEither
      )

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const getUserPropsFromResult = (result: any) =>
      pipe(
        result?.core?.user_results?.result,
        E.fromNullable('Failed to get user result'),
        E.chain(userResult =>
          pipe(
            tweetUserPropsSchema.validate({
              isProtected: userResult?.legacy?.protected,
              displayName: userResult?.legacy?.name,
              screenName: userResult?.legacy?.screen_name,
              userId: userResult?.rest_id,
            }),
            validationResultToEither
          )
        )
      )

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parseTweetFromBody = (body: any): Result<Tweet> =>
      pipe(
        E.Do,
        E.bind('result', () => this.getResultFromBody(body)),
        E.bind('tweetResult', payload =>
          getTweetResultFromResult(payload.result)
        ),
        E.bind('userProps', payload => getUserPropsFromResult(payload.result)),
        E.bind('medias', payload =>
          pipe(
            payload.tweetResult?.extended_entities?.media,
            E.fromNullable('Failed to get medias.')
          )
        ),
        E.bind('mediaCollection', payload =>
          E.tryCatch(
            () => parseMedias(payload.medias),
            e => E.toError(e).message ?? 'Failed to parse medias'
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
        E.match(toErrorResult<Tweet>, toSuccessResult<Tweet>)
      )

    return parseTweetFromBody(body)
  }

  protected parseMetadata(response: Response): ResponseMetadata {
    const quota = pipe(
      response.headers.get('X-Rate-Limit-Remaining'),
      O.fromNullable,
      O.match<string, ResponseMetadata['remainingQuota']>(
        /**
         * If the header is not present, it might be because the request was not successful.
         * In this case, we return -1 to indicate that the quota is unknown.
         */
        () => undefined,
        q => Number.parseInt(q, 10)
      )
    )

    const resetTime = pipe(
      // The value is in seconds
      response.headers.get('X-Rate-Limit-Reset'),
      O.fromNullable,
      O.match<string, ResponseMetadata['quotaResetTime']>(
        () => undefined,
        ts => new Date(Number.parseInt(ts, 10) * 1000)
      )
    )

    return {
      httpStatusCode: response.status,
      remainingQuota: quota,
      quotaResetTime: resetTime,
    }
  }

  protected async getCache() {
    return (this.cache ??=
      typeof this.config.cacheProvider === 'function'
        ? await this.config.cacheProvider()
        : this.config.cacheProvider)
  }

  async readFromCache(request: Request): Promise<Response | undefined> {
    const cache = await this.getCache()
    return cache.get(request)
  }

  async putIntoCache(request: Request, response: Response): Promise<void> {
    const cache = await this.getCache()
    if (response.ok) return cache.put(request.clone(), response.clone())
  }

  prepareRequest(context: RequestContext): Request {
    return new Request(this.makeEndpoint(context), {
      method: this.method,
      headers: this.makeHeaders(this.makeAuthHeaders(this.config.csrfToken)),
      mode: 'cors',
      referrer: `https://x.com/i/web/status/${this.config.tweetId}`,
    })
  }

  async resolveResponse(response: Response): Promise<FetchTweetCommandOutput> {
    const metadata = this.parseMetadata(response)

    if (!response.ok)
      return {
        $metadata: metadata,
        tweetResult: toErrorResult(
          new FetchTweetError('Failed to fetch tweet', response.status)
        ),
      }

    try {
      const body = await response.json()
      const result = this.parseBody(body)
      return {
        $metadata: metadata,
        tweetResult: result,
      }
    } catch (error) {
      return {
        $metadata: metadata,
        tweetResult: toErrorResult(
          new ParseTweetError('Failed to parse body', { cause: error })
        ),
      }
    }
  }
}

type Hashtag = {
  text: string
}

const parseHashtags = (entity: Record<string, unknown>): string[] =>
  ((entity?.hashtags as Hashtag[]) ?? []).map(v => v.text)

const validationResultToEither = <T>(
  result: ValidationResult<T>
): E.Either<string, T> =>
  result.error ? E.left(result.error.message) : E.right(result.value)

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

type MediaCollection = { images: TweetMedia[]; videos: TweetMedia[] }

const parseMedias = (medias: Media[]): MediaCollection => {
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

const parseBestVideoVariant = (variants: VideoVariant[]): string | undefined =>
  variants
    .filter(variant => variant.content_type === 'video/mp4')
    .reduce((prevVariant, currVariant) =>
      currVariant?.bitrate >= prevVariant?.bitrate ? currVariant : prevVariant
    ).url

const hasErrorProperty = (
  body: unknown
): body is { error?: string; errors?: string } => {
  return (
    typeof body === 'object' &&
    body !== null &&
    ('error' in body || 'errors' in body)
  )
}

export class ParseTweetError extends Error {
  name = 'ParseTweetError'
}

export class FetchTweetError extends Error {
  name = 'FetchTweetError'
  readonly statusCode: number

  constructor(message: string, statusCode: number, cause?: Error) {
    super(message, { cause })
    this.statusCode = statusCode
  }
}
