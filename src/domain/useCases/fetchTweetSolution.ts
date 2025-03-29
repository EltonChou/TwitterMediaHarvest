import type { Tweet } from '#domain/valueObjects/tweet'
import type { AsyncUseCase } from './base'

export type FetchTweetSolutionCommand = {
  tweetId: string
}

export type QuotaStatistic = {
  remaining?: number | 'omit'
  resetTime?: Date | 'omit'
  error?: Error
}

export type SolutionStatistics<Identify extends string = string> = {
  [key in Identify]?: QuotaStatistic
}

export type SolutionReport<StatisticIdentity extends string = string> = {
  tweetResult: Result<Tweet, FetchTweetSolutionError>
  statistics: SolutionStatistics<StatisticIdentity>
}

export interface FetchTweetSolution<StatisticIdentity extends string = string>
  extends AsyncUseCase<
      FetchTweetSolutionCommand,
      SolutionReport<StatisticIdentity>
    >,
    DomainEventSource {}

export abstract class FetchTweetSolutionError extends Error {
  name = 'FetchTweetSolutionError'
}

export class NoValidSolutionToken extends FetchTweetSolutionError {
  name = 'NoValidSolutionToken'
}

export class TweetIsNotFound extends FetchTweetSolutionError {
  name = 'TweetIsNotFound'
}

export class InsufficientQuota extends FetchTweetSolutionError {
  name = 'InsufficientQuota'
}

export class TweetProcessingError extends FetchTweetSolutionError {
  name = 'TweetProcessingError'
}
