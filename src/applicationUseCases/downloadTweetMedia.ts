import type { DownloadHistory } from '#domain/entities/downloadHistory'
import type { DomainEventPublisher } from '#domain/eventPublisher'
import InternalErrorHappened from '#domain/events/InternalErrorHappened'
import TweetApiFailed from '#domain/events/TweetApiFailed'
import TweetParsingFailed from '#domain/events/TweetParsingFailed'
import { tweetToDownloadHistory } from '#domain/factories/tweetToDownloadHistory'
import { tweetToTweetMediaFiles } from '#domain/factories/tweetToTweetMediaFiles'
import type { IDownloadHistoryRepository } from '#domain/repositories/downloadHistory'
import type {
  ISettingsRepository,
  ISettingsVORepository,
} from '#domain/repositories/settings'
import type { ITwitterTokenRepository } from '#domain/repositories/twitterToken'
import type { AsyncUseCase } from '#domain/useCases/base'
import type {
  DownloadMediaFileCommand,
  DownloadMediaFileUseCaseBuilder,
} from '#domain/useCases/downloadMediaFile'
import type { FetchTweet, FetchTweetCommand } from '#domain/useCases/fetchTweet'
import { FetchTweetError, ParseTweetError } from '#domain/useCases/fetchTweet'
import { DownloadTarget } from '#domain/valueObjects/downloadTarget'
import type { FilenameSetting } from '#domain/valueObjects/filenameSetting'
import type { Tweet } from '#domain/valueObjects/tweet'
import type { TweetInfo } from '#domain/valueObjects/tweetInfo'
import type { TweetMediaFile } from '#domain/valueObjects/tweetMediaFile'
import type { DownloadSettings, FeatureSettings } from '#schema'
import { toErrorResult, toSuccessResult } from '#utils/result'

type DownloadTweetMediaCommand = {
  tweetInfo: TweetInfo
}

export type DownloaderBuilderMap = {
  browser: DownloadMediaFileUseCaseBuilder
  aria2: DownloadMediaFileUseCaseBuilder
}

export type FetchTweetMap = {
  latest: FetchTweet
  fallback: FetchTweet
  guest: FetchTweet
}

type FetchTweetSolution = { fetchTweet: FetchTweet; command: FetchTweetCommand }

export type InfraProvider = {
  tokenRepo: ITwitterTokenRepository
  downloadHistoryRepo: IDownloadHistoryRepository
  filenameSettingRepo: ISettingsVORepository<FilenameSetting>
  downloadSettingsRepo: ISettingsRepository<DownloadSettings>
  featureSettingsRepo: ISettingsRepository<FeatureSettings>
  fetchTweet: FetchTweetMap
  downloaderBuilder: DownloaderBuilderMap
  eventPublisher: DomainEventPublisher
}

export type DonwloadTweetMediaOptions = {
  remainingQuotaThreshold: number
}

export class DownloadTweetMedia
  implements AsyncUseCase<DownloadTweetMediaCommand, boolean>
{
  constructor(
    readonly infra: InfraProvider,
    readonly options: DonwloadTweetMediaOptions
  ) {}

  async process(command: DownloadTweetMediaCommand): Promise<boolean> {
    const { value: fetchTweetSolutions, error: noValidCsrfToken } =
      await this.buildFetchTweetSolutions(command.tweetInfo.tweetId)

    if (noValidCsrfToken) {
      const event = new TweetApiFailed(command.tweetInfo, 401)
      this.infra.eventPublisher.publish(event)
      return false
    }

    const { value: tweet, error: fetchTweetError } =
      await this.fetchTweetWithSolutions(fetchTweetSolutions)

    if (fetchTweetError) {
      this.handleFetchTweetError(command.tweetInfo)(fetchTweetError)
      return false
    }

    await this.saveDownloadHistory(tweetToDownloadHistory(tweet))

    const filenameSetting = await this.infra.filenameSettingRepo.get()
    const { includeVideoThumbnail } = await this.infra.featureSettingsRepo.get()
    const downloader = await this.buildDownloader(command.tweetInfo)

    const downloadCommands = tweetToTweetMediaFiles(tweet)
      .filter(mediaFile => includeVideoThumbnail || !mediaFile.isThumbnail)
      .map(tweetMediaFileToDownloadTargetWithFilenameSettting(filenameSetting))
      .map(downloadTargetToDownloadCommand)

    for (const command of downloadCommands) {
      await downloader.process(command)
    }

    this.infra.eventPublisher.publishAll(...downloader.events)

    return downloader.isOk
  }

  /**
   * If error happens, it will not affect the download process.
   * Although user may be curious why the history didn't record correctly,
   * we should capture the error by logger or issue tracker(e.g. Sentry) and solve it implicitly in future patch.
   */
  private async saveDownloadHistory(downloadHistory: DownloadHistory) {
    const saveHistoryError =
      await this.infra.downloadHistoryRepo.save(downloadHistory)
    if (saveHistoryError) {
      // eslint-disable-next-line no-console
      console.error(saveHistoryError)
    }
  }

  private async buildDownloader(tweetInfo: TweetInfo) {
    const { enableAria2, askWhereToSave } =
      await this.infra.downloadSettingsRepo.get()
    return (
      enableAria2
        ? this.infra.downloaderBuilder.aria2
        : this.infra.downloaderBuilder.browser
    )({
      targetTweet: tweetInfo,
      shouldPrompt: askWhereToSave,
    })
  }

  private handleFetchTweetError(tweetInfo: TweetInfo) {
    return (error: Error) =>
      this.infra.eventPublisher.publish(
        mapFetchTweetErrorToEvent(error, tweetInfo)
      )
  }

  /**
   * Always try guest solution first.
   * When all solutions failed, we will use last error (401, 403, 429 or else) to notify user.
   * If last solution is guest solution, we may always get 403 (or 401) even the root cause is 429 in protected content.
   */
  private async buildFetchTweetSolutions(
    tweetId: string
  ): AsyncResult<FetchTweetSolution[], NoValidCsrfToken> {
    const csrfToken = await this.infra.tokenRepo.getCsrfToken()
    const guestToken = await this.infra.tokenRepo.getGuestToken()

    if (!csrfToken && !guestToken) return toErrorResult(new NoValidCsrfToken())

    const fetchTweetSolutions: FetchTweetSolution[] = []

    if (guestToken) {
      const fetchTweetCommand = {
        csrfToken: guestToken.value,
        tweetId: tweetId,
      }
      fetchTweetSolutions.push({
        fetchTweet: this.infra.fetchTweet.guest,
        command: fetchTweetCommand,
      })
    }

    if (csrfToken) {
      const fetchTweetCommand = {
        csrfToken: csrfToken.value,
        tweetId: tweetId,
      }
      fetchTweetSolutions.push(
        {
          fetchTweet: this.infra.fetchTweet.latest,
          command: fetchTweetCommand,
        },
        {
          fetchTweet: this.infra.fetchTweet.fallback,
          command: fetchTweetCommand,
        }
      )
    }

    return toSuccessResult(fetchTweetSolutions)
  }

  async fetchTweetWithSolutions(
    solutions: FetchTweetSolution[]
  ): AsyncResult<Tweet> {
    let remainingSolutions = solutions.length

    const errorRecords: { identity: string; failedReason: string }[] = []
    let fetchError: Error | undefined = undefined
    let guestFetchError: Error | undefined = undefined

    for (const { fetchTweet, command } of solutions) {
      remainingSolutions--

      const {
        value: tweet,
        error,
        remainingQuota,
      } = await fetchTweet.process(command)
      if (error) {
        errorRecords.push({
          identity: fetchTweet.identity,
          failedReason: error.message || error.name,
        })

        if (isGuestFetchTweet(fetchTweet)) {
          guestFetchError = error
        } else {
          // Only expose first non-guest error to user.
          fetchError ??= error
        }
      }

      // TODO: Determine the timing to emit quota warning.
      if (
        !isGuestFetchTweet(fetchTweet) &&
        remainingSolutions === 0 &&
        remainingQuota <= this.options.remainingQuotaThreshold
      )
        this.emitQuotaWarning(remainingQuota)

      if (tweet) return toSuccessResult(tweet)
    }

    // eslint-disable-next-line no-console
    console.table(errorRecords)
    return toErrorResult(
      fetchError ?? guestFetchError ?? new NoFetchTweetSolution()
    )
  }

  private emitQuotaWarning(_remainingQuota: number) {
    // TODO: emit quota warning
  }
}

const mapFetchTweetErrorToEvent = (
  fetchTweetError: Error,
  tweetInfo: TweetInfo
): IDomainEvent => {
  if (fetchTweetError instanceof ParseTweetError) {
    return new TweetParsingFailed(tweetInfo)
  }

  if (fetchTweetError instanceof FetchTweetError) {
    return new TweetApiFailed(tweetInfo, fetchTweetError.statusCode)
  }

  return new InternalErrorHappened(fetchTweetError.message, fetchTweetError, {
    isExplicit: true,
  })
}

const isGuestFetchTweet = (fetchTweet: FetchTweet): boolean =>
  fetchTweet.identity === 'guest'

const tweetMediaFileToDownloadTargetWithFilenameSettting =
  (filenameSetting: FilenameSetting) =>
  (mediaFile: TweetMediaFile): DownloadTarget =>
    new DownloadTarget({
      url: mediaFile.mapBy(props => props.source),
      filename: filenameSetting.makeFilename(mediaFile),
    })

const downloadTargetToDownloadCommand = (
  target: DownloadTarget
): DownloadMediaFileCommand => ({ target })

class NoValidCsrfToken extends Error {
  constructor() {
    super('No valid csrf token.')
  }
}

class NoFetchTweetSolution extends Error {
  constructor() {
    super('No fetch tweet solution.')
  }
}
