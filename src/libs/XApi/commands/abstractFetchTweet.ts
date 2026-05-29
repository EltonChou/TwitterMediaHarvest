/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { Tweet } from '#domain/valueObjects/tweet'
import { toErrorResult, toSuccessResult } from '#utils/result'
import {
  Instruction,
  isRestIdTweetBody,
  isTweetDetailBody,
  isTweetResult,
} from '../parsers/refinements'
import { parseTweet, retrieveTweetsFromInstruction } from '../parsers/tweet'
import { GraphQLCommand, Query } from './graphql'
import type {
  CacheAble,
  CommandCache,
  MetadataBearer,
  RequestContext,
  ResponseMetadata,
} from './types'
import * as O from 'fp-ts/Option'
import { pipe } from 'fp-ts/function'

export interface FetchTweetCommandInput extends LiteralObject {
  csrfToken: string
  tweetId: string
  cacheProvider: CommandCache | AsyncProvider<CommandCache>
  transactionIdProvider?: (
    path: string,
    method: string
  ) => Promise<string | undefined>
}

// TODO: Should we isolate tweet object?
export interface FetchTweetCommandOutput extends MetadataBearer {
  tweetResult: Result<Tweet>
}

export abstract class FetchTweetCommand
  extends GraphQLCommand<FetchTweetCommandInput, FetchTweetCommandOutput>
  implements CacheAble
{
  readonly isCacheAble = true
  readonly config: FetchTweetCommandInput
  private cache: CommandCache | undefined = undefined

  constructor(config: FetchTweetCommandInput, query: Query) {
    super(query)
    this.config = config
  }

  protected parseBody(body: unknown): Result<Tweet> {
    if (!body) {
      return hasErrorProperty(body)
        ? toErrorResult(
            new ParseTweetError(body.error ?? body.errors ?? 'Invalid body')
          )
        : toErrorResult(new ParseTweetError('Invalid body'))
    }

    if (isRestIdTweetBody(body) && isTweetResult(body.data.tweetResult)) {
      return toSuccessResult(parseTweet(body.data.tweetResult.result).tweet)
    }

    if (isTweetDetailBody(body)) {
      const [addEntriesInstruction] =
        body.data.threaded_conversation_with_injections_v2.instructions.filter(
          Instruction.isTimelineAddEntries
        )

      if (!addEntriesInstruction)
        return toErrorResult(new ParseTweetError('Invalid instructions'))

      // TODO: Maybe we should let the retriever has an early return mechanism
      // when it finds target tweet.
      const [targetTweet] = retrieveTweetsFromInstruction(
        addEntriesInstruction
      ).filter(tweet => tweet.rest_id === this.config.tweetId)

      if (!targetTweet)
        return toErrorResult(
          new ParseTweetError(
            `Cannot find target tweet. (tweetId: ${this.config.tweetId})`
          )
        )

      return toSuccessResult(parseTweet(targetTweet).tweet)
    }

    return toErrorResult(new ParseTweetError('Invalid body'))
  }

  protected parseMetadata(response: Response): ResponseMetadata {
    const quota = pipe(
      response.headers.get('X-Rate-Limit-Remaining'),
      O.fromNullable,
      O.match<string, ResponseMetadata['remainingQuota']>(
        /**
         * If the header is not present, it might be because the request was not successful.
         * In this case, we return `undefined` to indicate that the quota is unknown.
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
    if (response.ok) return cache.put(request, response)
  }

  async prepareRequest(context: RequestContext): Promise<Request> {
    const transactionId = this.config.transactionIdProvider
      ? await this.config.transactionIdProvider(
          `${this.rootPath}${this.query.id}/${this.query.name}`,
          this.query.method
        )
      : undefined

    return new Request(this.makeEndpoint(context), {
      method: this.method,
      headers: this.makeHeaders(
        this.makeAuthHeaders(this.config.csrfToken, transactionId)
      ),
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
