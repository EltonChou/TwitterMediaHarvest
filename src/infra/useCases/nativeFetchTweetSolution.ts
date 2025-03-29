import SolutionQuotaInsufficient from '#domain/events/NativeTweetSolutionQuotaInsufficient'
import type { Factory } from '#domain/factories/base'
import type { ITwitterTokenRepository } from '#domain/repositories/twitterToken'
import type {
  FetchTweetSolution,
  FetchTweetSolutionCommand,
  FetchTweetSolutionError,
  QuotaStatistic,
  SolutionReport,
  SolutionStatistics,
} from '#domain/useCases/fetchTweetSolution'
import {
  InsufficientQuota,
  NoValidSolutionToken,
  TweetIsNotFound,
  TweetProcessingError,
} from '#domain/useCases/fetchTweetSolution'
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
  /** How much quota should be reserved for normal usage */
  quotaThreshold: number
}

export class NativeFetchTweetSolution
  implements FetchTweetSolution<StatisticIdentity>
{
  private infra: InfraProvider
  private options: SolutionOptions
  private cache: CacheStorage | undefined
  private _events: IDomainEvent[]

  constructor(infraProvider: InfraProvider, options: SolutionOptions) {
    this.infra = infraProvider
    this.options = options
    this.cache = undefined
    this._events = []
  }

  get events() {
    return this._events
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
      setStat: (stat: QuotaStatistic) => void
    }) => {
      const command = new CommandConstructor({
        tweetId: config.tweetId,
        csrfToken: config.csrfToken,
        cacheProvider: () => this.getCacheStorage(),
      })

      const { value, error } = await this.infra.xApiClient.exec(command)

      config.setStat({
        error: error ?? value.tweetResult.error,
        ...(value ? commandOutputToQuotaStats(value) : {}),
      })

      return { value, error }
    }
  }

  async process(
    command: FetchTweetSolutionCommand
  ): Promise<SolutionReport<StatisticIdentity>> {
    const stats: SolutionStatistics<StatisticIdentity> = {}
    const csrfToken = await this.infra.xTokenRepo.getCsrfToken()
    const guestToken = await this.infra.xTokenRepo.getGuestToken()

    if (guestToken) {
      const guestResult = await this.execCommand(GuestFetchTweetCommand)({
        tweetId: command.tweetId,
        csrfToken: guestToken.value,
        setStat: stat => (stats.guest = stat),
      })

      if (isSuccessfulTweetResult(guestResult)) {
        return {
          statistics: stats,
          tweetResult: guestResult.value.tweetResult,
        }
      }
    }

    if (csrfToken) {
      const generalResult = await this.execCommand(LatestFetchTweetCommand)({
        tweetId: command.tweetId,
        csrfToken: csrfToken.value,
        setStat: stat => (stats.general = stat),
      })

      if (isSuccessfulTweetResult(generalResult)) {
        if (this.isQuotaLow(generalResult.value))
          this._events.push(
            new SolutionQuotaInsufficient(
              generalResult.value.$metadata.remainingQuota,
              generalResult.value.$metadata.quotaResetTime
            )
          )

        return {
          statistics: stats,
          tweetResult: generalResult.value.tweetResult,
        }
      }

      const fallbackResult = await this.execCommand(FallbackFetchTweet)({
        tweetId: command.tweetId,
        csrfToken: csrfToken.value,
        setStat: stat => (stats.fallback = stat),
      })

      if (isSuccessfulTweetResult(fallbackResult)) {
        return {
          statistics: stats,
          tweetResult: fallbackResult.value.tweetResult,
        }
      }

      const exposedCommandError = generalResult.error ?? fallbackResult.error

      return {
        statistics: stats,
        tweetResult: toErrorResult(
          this.parseCommandError(exposedCommandError) ??
            new TweetIsNotFound(
              `Specified tweet is not found (${command.tweetId})`,
              {
                cause: exposedCommandError,
              }
            )
        ),
      }
    }

    return {
      statistics: stats,
      tweetResult: toErrorResult(
        new NoValidSolutionToken('No valid solution token')
      ),
    }
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
  private isQuotaLow(
    commandOutput: FetchTweetCommandOutput
  ): commandOutput is FetchTweetCommandOutput & ValidQuotaValue {
    return (
      typeof commandOutput.$metadata.remainingQuota === 'number' &&
      commandOutput.$metadata.quotaResetTime instanceof Date &&
      commandOutput.$metadata.remainingQuota <= this.options.quotaThreshold
    )
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
