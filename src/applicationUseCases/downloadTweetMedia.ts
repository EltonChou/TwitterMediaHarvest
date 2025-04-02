import type { DownloadHistory } from '#domain/entities/downloadHistory'
import type { DomainEventPublisher } from '#domain/eventPublisher'
import TweetApiFailed from '#domain/events/TweetApiFailed'
import TweetParsingFailed from '#domain/events/TweetParsingFailed'
import { tweetToDownloadHistory } from '#domain/factories/tweetToDownloadHistory'
import { tweetToTweetMediaFiles } from '#domain/factories/tweetToTweetMediaFiles'
import type { IDownloadHistoryRepository } from '#domain/repositories/downloadHistory'
import type {
  ISettingsRepository,
  ISettingsVORepository,
} from '#domain/repositories/settings'
import type { AsyncUseCase } from '#domain/useCases/base'
import type {
  DownloadMediaFileCommand,
  DownloadMediaFileUseCaseBuilder,
} from '#domain/useCases/downloadMediaFile'
import type {
  FetchTweetSolution,
  SolutionStatistics,
} from '#domain/useCases/fetchTweetSolution'
import {
  FetchTweetSolutionError,
  InsufficientQuota,
  NoValidSolutionToken,
  TweetIsNotFound,
  TweetProcessingError,
} from '#domain/useCases/fetchTweetSolution'
import { DownloadTarget } from '#domain/valueObjects/downloadTarget'
import type { FilenameSetting } from '#domain/valueObjects/filenameSetting'
import { Tweet } from '#domain/valueObjects/tweet'
import type { TweetInfo } from '#domain/valueObjects/tweetInfo'
import type { TweetMediaFile } from '#domain/valueObjects/tweetMediaFile'
import type { DownloadSettings, FeatureSettings } from '#schema'

type DownloadTweetMediaCommand = {
  tweetInfo: TweetInfo
}

export type DownloaderBuilderMap = {
  browser: DownloadMediaFileUseCaseBuilder
  aria2: DownloadMediaFileUseCaseBuilder
}

export type InfraProvider = {
  downloadHistoryRepo: IDownloadHistoryRepository
  filenameSettingRepo: ISettingsVORepository<FilenameSetting>
  downloadSettingsRepo: ISettingsRepository<DownloadSettings>
  featureSettingsRepo: ISettingsRepository<FeatureSettings>
  downloaderBuilder: DownloaderBuilderMap
  eventPublisher: DomainEventPublisher
  solutionProvider: () => FetchTweetSolution
}

export class DownloadTweetMedia
  implements AsyncUseCase<DownloadTweetMediaCommand, boolean>
{
  constructor(readonly infra: InfraProvider) {}

  async process({ tweetInfo }: DownloadTweetMediaCommand): Promise<boolean> {
    const solution = this.infra.solutionProvider()
    const tweetResult = await solution.process({
      tweetId: tweetInfo.tweetId,
    })

    await this.infra.eventPublisher.publishAll(...solution.events)
    await this.reportSolutionStatistics(solution.statistics)

    if (tweetResult.error)
      return this.failDownload(tweetResult.error, tweetInfo)

    await this.saveDownloadHistory(tweetToDownloadHistory(tweetResult.value))

    return this.processDownload(tweetInfo, tweetResult.value)
  }

  private async processDownload(tweetInfo: TweetInfo, tweet: Tweet) {
    const downloader = await this.buildDownloader(tweetInfo)
    const downloadCommands = await this.createDownloadCommands(tweet)

    await Promise.allSettled(
      downloadCommands.map(command => downloader.process(command))
    )

    await this.infra.eventPublisher.publishAll(...downloader.events)
    return downloader.isOk
  }

  private async createDownloadCommands(tweet: Tweet) {
    const filenameSetting = await this.infra.filenameSettingRepo.get()
    const { includeVideoThumbnail } = await this.infra.featureSettingsRepo.get()

    return tweetToTweetMediaFiles(tweet)
      .filter(mediaFile => includeVideoThumbnail || !mediaFile.isThumbnail)
      .map(tweetMediaFileToDownloadTargetWithFilenameSettting(filenameSetting))
      .map(downloadTargetToDownloadCommand)
  }

  private async failDownload(
    error: FetchTweetSolutionError,
    tweetInfo: TweetInfo
  ) {
    if (error instanceof NoValidSolutionToken) {
      const errorCode = ensureErrorHasCode(error?.cause) ?? 401
      await this.infra.eventPublisher.publish(
        new TweetApiFailed(tweetInfo, errorCode)
      )
    } else if (error instanceof TweetIsNotFound) {
      const errorCode = ensureErrorHasCode(error?.cause) ?? 404
      await this.infra.eventPublisher.publish(
        new TweetApiFailed(tweetInfo, errorCode)
      )
    } else if (
      error instanceof InsufficientQuota &&
      error.isInternalControl === false
    ) {
      await this.infra.eventPublisher.publish(
        new TweetApiFailed(tweetInfo, 429)
      )
    } else if (error instanceof TweetProcessingError) {
      await this.infra.eventPublisher.publish(new TweetParsingFailed(tweetInfo))
    } else {
      // Handle other errors
      console.error('An unexpected error occurred', error)
    }
    return false
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

    const buildDownloaderWith = enableAria2
      ? this.infra.downloaderBuilder.aria2
      : this.infra.downloaderBuilder.browser

    return buildDownloaderWith({
      targetTweet: tweetInfo,
      shouldPrompt: askWhereToSave,
    })
  }

  private async reportSolutionStatistics(_statistics: SolutionStatistics) {
    // TODO: report statistics
  }
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

/**
 * Ensures that the error cause has a numeric code property.
 * This is used to extract HTTP status codes or other error codes from various error objects.
 * @param cause The error cause to check
 * @returns The error code as a number, or undefined if no valid code is found
 */
const ensureErrorHasCode = (cause: unknown): number | undefined => {
  if (!cause) return undefined

  if (typeof cause === 'object') {
    // Check for code property
    if ('code' in cause && typeof cause.code === 'number') {
      return cause.code
    }

    // Check for statusCode property
    if ('statusCode' in cause && typeof cause.statusCode === 'number') {
      return cause.statusCode
    }
  }

  return undefined
}
