/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import type { Tweet } from '#domain/valueObjects/tweet'
import type { AsyncUseCase } from './base'

export type FetchTweetSolutionCommand = {
  tweetId: string
}

export type FetchTweetSolutionWithTransactinIdCommand = {
  transactionIdProvider?: TransactionIdProvider
} & FetchTweetSolutionCommand

export type QuotaStatistic = {
  remaining?: number | 'omit'
  resetTime?: Date | 'omit'
  error?: Error
}

export type SolutionStatistics<Identify extends string = string> = {
  [key in Identify]?: QuotaStatistic
}

export interface FetchTweetSolution<
  StatisticIdentity extends string = string,
  Command = FetchTweetSolutionCommand,
> extends AsyncUseCase<Command, Result<Tweet, FetchTweetSolutionError>>,
    DomainEventSource {
  readonly isTransactionIdConsumer: boolean
  readonly statistics: SolutionStatistics<StatisticIdentity>
}

export interface FetchTweetSolutionWithTransactionId<
  StatisticIdentity extends string = string,
> extends FetchTweetSolution<
    StatisticIdentity,
    FetchTweetSolutionWithTransactinIdCommand
  > {
  readonly isTransactionIdConsumer: true
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

export function isTransactionIdConsumer<T extends string>(
  solution: FetchTweetSolution<T>
): solution is FetchTweetSolutionWithTransactionId<T> {
  return solution.isTransactionIdConsumer === true
}

export type TransactionIdProvider = (
  path: string,
  method: string
) => AsyncResult<string>
