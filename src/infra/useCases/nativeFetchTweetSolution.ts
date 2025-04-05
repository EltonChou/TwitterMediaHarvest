import { SolutionQuota } from '#domain/entities/solutionQuota'
import TweetSolutionQuotaChanged from '#domain/events/TweetSolutionQuotaChanged'
import TweetSolutionQuotaInsufficient from '#domain/events/TweetSolutionQuotaInsufficient'
import type { Factory } from '#domain/factories/base'
import type { ISolutionQuotaRepository } from '#domain/repositories/solutionQuota'
import type { ITwitterTokenRepository } from '#domain/repositories/twitterToken'
import type {
  FetchTweetSolution,
  FetchTweetSolutionCommand,
  FetchTweetSolutionError,
  QuotaStatistic,
  SolutionStatistics,
} from '#domain/useCases/fetchTweetSolution'
import {
  InsufficientQuota,
  NoValidSolutionToken,
  TweetIsNotFound,
  TweetProcessingError,
} from '#domain/useCases/fetchTweetSolution'
import { Tweet } from '#domain/valueObjects/tweet'
import FetchTweetSolutionId from '#enums/FetchTweetSolution'
import type {
  FetchTweetCommand,
  FetchTweetCommandInput,
  FetchTweetCommandOutput,
  ApiClient as XApiClient,
} from '#libs/XApi'
import {
  FallbackFetchTweet,
  GuestFetchTweetCommand,
  LatestFetchTweetCommand,
  ParseTweetError,
} from '#libs/XApi'
import { FetchTweetError } from '#libs/XApi'
import type { CommandCache } from '#libs/XApi/commands/types'
import { toErrorResult } from '#utils/result'

export interface InfraProvider {
  solutionQuotaRepo: ISolutionQuotaRepository
  xTokenRepo: ITwitterTokenRepository
  xApiClient: XApiClient
}

interface FetchCommandConstructor {
  new (input: FetchTweetCommandInput): FetchTweetCommand
}

class CacheStorage implements CommandCache {
  constructor(readonly cache: Cache) {}

  get(request: Request): Promise<Response | undefined> {
    return this.cache.match(request)
  }

  put(request: Request, response: Response): Promise<void> {
    return this.cache.put(request, response)
  }
}

type StatisticIdentity = 'general' | 'fallback' | 'guest'

type SolutionOptions = {
  /** How much quota should be reserved for normal usage. */
  reservedQuota: number
  /**
   * Threshold to triiger `TweetSolutionQuotaInsufficient`.
   *
   * The comparision is `<=`
   */
  quotaThreshold: number
}

/**
 * Implementation of FetchTweetSolution that handles fetching tweets using native Twitter/X API.
 * This solution manages different fetch strategies including guest access, general access, and fallback mechanisms.
 * It also handles quota management, caching, and error handling for tweet fetching operations.
 *
 * @implements {FetchTweetSolution<StatisticIdentity>}
 *
 * @example
 * ```typescript
 * const infraProvider = {
 *   solutionQuotaRepo,
 *   xTokenRepo,
 *   xApiClient
 * };
 * const options = { reservedQuota: 100, quotaThreshold: 50 };
 * const solution = new NativeFetchTweetSolution(infraProvider, options);
 * const result = await solution.process({ tweetId: '123456789' });
 * ```
 *
 * @remarks
 * The solution implements a multi-layered approach to fetch tweets:
 * 1. Attempts guest token access first
 * 2. Checks quota availability
 * 3. Tries general access with latest API
 * 4. Falls back to alternative endpoint if needed
 *
 * @remarks
 * The error would be return in the result, no need to use try-catch statement.
 *
 * @throws {InsufficientQuota} When the remaining quota is below the reserved threshold
 * @throws {NoValidSolutionToken} When no valid authentication token is available
 * @throws {TweetIsNotFound} When the requested tweet cannot be found
 * @throws {TweetProcessingError} When the tweet data cannot be parsed
 *
 * @emits {TweetSolutionQuotaChanged} When the remaining quota changes after a successful API call
 * @see {@link TweetSolutionQuotaChanged}
 *
 * @emits {TweetSolutionQuotaInsufficient}  When remaining quota falls below or equals quota threshold provided in option
 * @see {@link TweetSolutionQuotaInsufficient}
 */
export class NativeFetchTweetSolution
  implements FetchTweetSolution<StatisticIdentity>
{
  private infra: InfraProvider
  private options: SolutionOptions
  private cache: CacheStorage | undefined
  private _events: IDomainEvent[]
  private _statistics: SolutionStatistics<StatisticIdentity>

  constructor(infraProvider: InfraProvider, options: SolutionOptions) {
    this.infra = infraProvider
    this.options = options
    this.cache = undefined
    this._events = []
    this._statistics = {}
  }

  get statistics(): SolutionStatistics<StatisticIdentity> {
    return this._statistics
  }

  get events() {
    return this._events
  }

  private setStatistics(identity: StatisticIdentity) {
    return (stat: QuotaStatistic) => (this._statistics[identity] = stat)
  }

  private async getCacheStorage() {
    if (this.cache) return this.cache
    const cacheStorage = await caches.open('fetch-tweet')
    this.cache = new CacheStorage(cacheStorage)
    return this.cache
  }

  execCommand(CommandConstructor: FetchCommandConstructor) {
    return async (config: {
      tweetId: string
      csrfToken: string
      statIdentity: StatisticIdentity
    }) => {
      const command = new CommandConstructor({
        tweetId: config.tweetId,
        csrfToken: config.csrfToken,
        cacheProvider: this.getCacheStorage,
      })

      const { value, error } = await this.infra.xApiClient.exec(command)

      this.setStatistics(config.statIdentity)({
        error: error ?? value.tweetResult.error,
        ...(value ? commandOutputToQuotaStats(value) : {}),
      })

      return { value, error }
    }
  }

  async process(
    command: FetchTweetSolutionCommand
  ): Promise<Result<Tweet, FetchTweetSolutionError>> {
    const csrfToken = await this.infra.xTokenRepo.getCsrfToken()
    const guestToken = await this.infra.xTokenRepo.getGuestToken()

    const guestCsrfToken = guestToken?.value ?? csrfToken?.value
    if (guestCsrfToken) {
      const guestResult = await this.execCommand(GuestFetchTweetCommand)({
        statIdentity: 'guest',
        tweetId: command.tweetId,
        csrfToken: guestCsrfToken,
      })

      if (isSuccessfulTweetResult(guestResult))
        return guestResult.value.tweetResult
    }

    const solutionQuota = await this.infra.solutionQuotaRepo.get(
      FetchTweetSolutionId.Native
    )

    if (solutionQuota !== undefined && !this.hasEnoughQuota(solutionQuota)) {
      this._events.push(
        new TweetSolutionQuotaInsufficient(
          FetchTweetSolutionId.Native,
          this.calculateUsableQuota(solutionQuota.quota.remaining),
          solutionQuota.quota.resetTime
        )
      )

      return toErrorResult(
        new InsufficientQuota(
          `Remaining quota is less than reserved quota (${this.options.reservedQuota}). `,
          { isInternalControl: true }
        )
      )
    }

    if (csrfToken) {
      const generalResult = await this.execCommand(LatestFetchTweetCommand)({
        statIdentity: 'general',
        tweetId: command.tweetId,
        csrfToken: csrfToken.value,
      })

      if (hasValidQuotaValue(generalResult.value)) {
        this._events.push(
          new TweetSolutionQuotaChanged(
            FetchTweetSolutionId.Native,
            generalResult.value.$metadata.remainingQuota,
            generalResult.value.$metadata.quotaResetTime
          )
        )
      }

      if (isSuccessfulTweetResult(generalResult)) {
        if (this.isCommandOutputLowQuota(generalResult.value))
          this._events.push(
            new TweetSolutionQuotaInsufficient(
              FetchTweetSolutionId.Native,
              this.calculateUsableQuota(
                generalResult.value.$metadata.remainingQuota
              ),
              generalResult.value.$metadata.quotaResetTime
            )
          )

        return generalResult.value.tweetResult
      }

      const fallbackResult = await this.execCommand(FallbackFetchTweet)({
        statIdentity: 'fallback',
        tweetId: command.tweetId,
        csrfToken: csrfToken.value,
      })

      if (isSuccessfulTweetResult(fallbackResult))
        return fallbackResult.value.tweetResult

      const exposedCommandError = generalResult.error ?? fallbackResult.error

      return toErrorResult(
        this.parseCommandError(exposedCommandError) ??
          new TweetIsNotFound(
            `Specified tweet is not found (${command.tweetId})`,
            {
              cause: exposedCommandError,
            }
          )
      )
    }

    return toErrorResult(new NoValidSolutionToken('No valid solution token'))
  }

  /**
   * Parse error from fetch tweet command output.
   * If the error is caused by API error (e.g. rate limit exceeded),
   * it will be wrapped in TweetIsNotFound error.
   *
   * @param output - The command output
   * @returns Error if the command failed, undefined otherwise
   */
  private parseCommandError(
    commandError: FetchTweetError | ParseTweetError | Error | undefined
  ): FetchTweetSolutionError | undefined {
    if (!commandError) return undefined

    if (commandError instanceof FetchTweetError) {
      switch (commandError.statusCode) {
        case 429:
          return new InsufficientQuota('Rate limit exceeded')
        case 401:
          return new NoValidSolutionToken('Unauthorized')
        case 403:
          return new NoValidSolutionToken('Forbidden')
        case 404:
          return new TweetIsNotFound('Specified tweet is not found')
        default:
          return new TweetIsNotFound(`Failed to fetch tweet`, {
            cause: commandError,
          })
      }
    }

    if (commandError instanceof ParseTweetError) {
      return new TweetProcessingError('Failed to parse tweet', {
        cause: commandError,
      })
    }
  }

  /**
   * Check if the remaining quota is low. Implictly, the quota and reset time are both checked.
   *
   * @param commandOutput - The command output.
   * @returns True if the remaining quota is low, false otherwise.
   */
  private isCommandOutputLowQuota(
    commandOutput: FetchTweetCommandOutput
  ): commandOutput is FetchTweetCommandOutput & ValidQuotaValue {
    return (
      typeof commandOutput.$metadata.remainingQuota === 'number' &&
      commandOutput.$metadata.quotaResetTime instanceof Date &&
      this.calculateUsableQuota(commandOutput.$metadata.remainingQuota) <=
        this.options.quotaThreshold + this.options.reservedQuota
    )
  }

  /**
   * Check if the remaining quota is sufficient for download usage.
   *
   * @param solutionQuota - The solution quota entity
   * @returns True if the remaining quota is above threshold, false otherwise.
   */
  private hasEnoughQuota(solutionQuota: SolutionQuota): boolean {
    if (solutionQuota.quota.isReset) return true
    return solutionQuota.quota.remaining > this.options.reservedQuota
  }

  /**
   * @param remainingQuota
   * @returns usable quota which is not less than 0.
   */
  private calculateUsableQuota(remainingQuota: number): number {
    return Math.max(remainingQuota - this.options.reservedQuota, 0)
  }
}

type ValidQuotaValue = {
  $metadata: {
    remainingQuota: number
    quotaResetTime: Date
  }
}

const commandOutputToQuotaStats: Factory<
  FetchTweetCommandOutput,
  Omit<QuotaStatistic, 'error'>
> = output => ({
  remaining: output.$metadata.remainingQuota,
  resetTime: output.$metadata.quotaResetTime,
})

const isSuccessfulTweetResult = (result: {
  value?: FetchTweetCommandOutput
  error?: Error
}): result is {
  value: FetchTweetCommandOutput & {
    tweetResult: {
      value: NonNullable<FetchTweetCommandOutput['tweetResult']['value']>
    }
  }
} => result.value?.tweetResult?.value !== undefined

const hasValidQuotaValue = (
  output?: FetchTweetCommandOutput
): output is FetchTweetCommandOutput & ValidQuotaValue => {
  return (
    output !== undefined &&
    typeof output.$metadata.remainingQuota === 'number' &&
    output.$metadata.quotaResetTime instanceof Date
  )
}
