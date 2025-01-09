import type { Tweet } from '#domain/valueObjects/tweet'
import type { AsyncUseCase } from './base'

export type FetchTweetCommand = {
  csrfToken: string
  tweetId: string
}

export type TweetResult =
  | {
      value: Tweet
      remainingQuota: number
      error: undefined
    }
  | {
      value: undefined
      remainingQuota: -1
      error: Error | FetchTweetError | ParseTweetError
    }

export interface FetchTweet
  extends AsyncUseCase<FetchTweetCommand, TweetResult> {
  readonly identity: string
}

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
