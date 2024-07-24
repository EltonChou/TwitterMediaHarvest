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

// TODO: Logger and Tracker (like sentry).
export class DownloadTweetMedia
  implements AsyncUseCase<DownloadTweetMediaCommand, boolean>
{
  constructor(
    readonly tokenRepo: ITwitterTokenRepository,
    readonly downloadHistoryRepo: IDownloadHistoryRepository,
    readonly filenameSettingRepo: ISettingsVORepository<FilenameSetting>,
    readonly downloadSettingsRepo: ISettingsRepository<DownloadSettings>,
    readonly featureSettingsRepo: ISettingsRepository<FeatureSettings>,
    readonly fetchTweet: FetchTweetMap,
    readonly downloaderBuilder: DownloaderBuilderMap,
    readonly eventPublisher: DomainEventPublisher
  ) {}

  async process(command: DownloadTweetMediaCommand): Promise<boolean> {
    const { value: fetchTweetSolutions, error: noValidCsrfToken } =
      await this.buildFetchTweetSolutions(command.tweetInfo.tweetId)

    if (noValidCsrfToken) {
      const event = new TweetApiFailed(command.tweetInfo, 401)
      this.eventPublisher.publish(event)
      return false
    }

    const { value: tweet, error: fetchTweetError } = await this.fetchTweetWithSolutions(
      fetchTweetSolutions
    )

    if (fetchTweetError) {
      this.handleFetchTweetError(command.tweetInfo)(fetchTweetError)
      return false
    }

    await this.saveDownloadHistory(tweetToDownloadHistory(tweet))

    const filenameSetting = await this.filenameSettingRepo.get()
    const { includeVideoThumbnail } = await this.featureSettingsRepo.get()
    const downloader = await this.buildDownloader(command.tweetInfo)

    const downloadTask = Promise.allSettled(
      tweetToTweetMediaFiles(tweet)
        .filter(mediaFile => includeVideoThumbnail || !mediaFile.isThumbnail)
        .map(tweetMediaFileToDownloadTargetWithFilenameSettting(filenameSetting))
        .map(downloadTargetToDownloadCommand)
        .map(downloader.process)
    )

    await downloadTask
    this.eventPublisher.publishAll(...downloader.events)

    return downloader.isOk
  }

  /**
   * If error happens, it will not affect the download process.
   * Although user may curious why the history didn't record correctly,
   * we should capture the error by logger or issue tracker(e.g. Sentry) and solve it implicitly in future patch.
   */
  async saveDownloadHistory(downloadHistory: DownloadHistory) {
    // TODO: capture error.
    const saveHistoryError = await this.downloadHistoryRepo.save(downloadHistory)
  }

  async buildDownloader(tweetInfo: TweetInfo) {
    const { enableAria2, askWhereToSave } = await this.downloadSettingsRepo.get()
    return (enableAria2 ? this.downloaderBuilder.aria2 : this.downloaderBuilder.browser)({
      targetTweet: tweetInfo,
      shouldPrompt: askWhereToSave,
    })
  }

  handleFetchTweetError(tweetInfo: TweetInfo) {
    return (error: Error) =>
      this.eventPublisher.publish(mapFetchTweetErrorToEvent(error, tweetInfo))
  }

  async buildFetchTweetSolutions(
    tweetId: string
  ): AsyncResult<FetchTweetSolution[], NoValidCsrfToken> {
    const csrfToken = await this.tokenRepo.getCsrfToken()
    const guestToken = await this.tokenRepo.getGuestToken()

    if (!csrfToken && !guestToken) return toErrorResult(new NoValidCsrfToken())

    const fetchTweetSolutions: FetchTweetSolution[] = []

    // TODO: Should we prefer guest endpoint over authed endpoint to prevent consuming api quota?
    if (csrfToken) {
      const fetchTweetCommand = {
        csrfToken: csrfToken.value,
        tweetId: tweetId,
      }
      fetchTweetSolutions.push(
        { fetchTweet: this.fetchTweet.latest, command: fetchTweetCommand },
        { fetchTweet: this.fetchTweet.fallback, command: fetchTweetCommand }
      )
    }

    if (guestToken) {
      const fetchTweetCommand = {
        csrfToken: guestToken.value,
        tweetId: tweetId,
      }
      fetchTweetSolutions.push({
        fetchTweet: this.fetchTweet.guest,
        command: fetchTweetCommand,
      })
    }

    return toSuccessResult(fetchTweetSolutions)
  }

  async fetchTweetWithSolutions(solutions: FetchTweetSolution[]): AsyncResult<Tweet> {
    let remainingSolutions = solutions.length

    const emitQuotaWarning = (quota: number) => {
      // TODO: emit quota warning
    }

    let fetchError: Error = new NoFetchTweetSolution()
    for (const { fetchTweet, command } of solutions) {
      const { value: tweet, error, remainingQuota } = await fetchTweet.process(command)

      if (--remainingSolutions === 0 && tweet) emitQuotaWarning(remainingQuota)
      if (tweet) return toSuccessResult(tweet)

      fetchError = error
    }

    // assert fetchError is Error
    return toErrorResult(fetchError)
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
