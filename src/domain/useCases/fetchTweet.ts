import type { Tweet } from '#domain/valueObjects/tweet'
import type { AsyncUseCase } from './base'

export type FetchTweetCommand = {
  csrfToken: string
  tweetId: string
}

export type FetchTweet = AsyncUseCase<FetchTweetCommand, Result<Tweet>>

export class FetchTweetError extends Error {
  name = 'FetchTweetError'

  readonly statusCode: number

  constructor(statusCode: number) {
    super()
    this.statusCode = statusCode
  }
}

export class ParseTweetError extends Error {
  name = 'ParseTweetError'
}
