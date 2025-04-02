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

export interface FetchTweetSolution<StatisticIdentity extends string = string>
  extends AsyncUseCase<
      FetchTweetSolutionCommand,
      Result<Tweet, FetchTweetSolutionError>
    >,
    DomainEventSource {
  readonly statistics: SolutionStatistics<StatisticIdentity>
}

export abstract class FetchTweetSolutionError extends Error {
  name = 'FetchTweetSolutionError'
}

export class NoValidSolutionToken extends FetchTweetSolutionError {
  name = 'NoValidSolutionToken'
}

export class TweetIsNotFound extends FetchTweetSolutionError {
  name = 'TweetIsNotFound'
}

type InsufficientQuotaErrorOptions = {
  isInternalControl: boolean
}

export class InsufficientQuota
  extends FetchTweetSolutionError
  implements IsInternalControl
{
  name = 'InsufficientQuota'

  /** When it is true that means the error is raised by internal quota control. */
  readonly isInternalControl: boolean

  constructor(
    msg: string,
    options?: ErrorOptions & Partial<InsufficientQuotaErrorOptions>
  ) {
    const { isInternalControl, ...errorOptions } = options ?? {
      isInternalControl: false,
    }
    super(msg, errorOptions)
    this.isInternalControl = isInternalControl ?? false
  }
}

export class TweetProcessingError extends FetchTweetSolutionError {
  name = 'TweetProcessingError'
}

interface IsInternalControl {
  /** When it is true that means the error is raised by internal quota control. */
  readonly isInternalControl: boolean
}
