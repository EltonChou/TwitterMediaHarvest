/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import type { DownloadHistory } from '#domain/entities/downloadHistory'
import type { DomainEventPublisher } from '#domain/eventPublisher'
import TweetApiFailed from '#domain/events/TweetApiFailed'
import TweetParsingFailed from '#domain/events/TweetParsingFailed'
import { tweetToDownloadHistory } from '#domain/factories/tweetToDownloadHistory'
import { tweetToAvailableTweetMediaFiles } from '#domain/factories/tweetToTweetMediaFiles'
import { ICache } from '#domain/repositories/cache'
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
  TransactionIdProvider,
} from '#domain/useCases/fetchTweetSolution'
import {
  FetchTweetSolutionError,
  InsufficientQuota,
  NoValidSolutionToken,
  TweetIsNotFound,
  TweetProcessingError,
  isTransactionIdConsumer,
} from '#domain/useCases/fetchTweetSolution'
import { DownloadTarget } from '#domain/valueObjects/downloadTarget'
import type { FilenameSetting } from '#domain/valueObjects/filenameSetting'
import { Tweet } from '#domain/valueObjects/tweet'
import type { TweetInfo } from '#domain/valueObjects/tweetInfo'
import type { TweetMediaFile } from '#domain/valueObjects/tweetMediaFile'
import { TweetWithContent } from '#domain/valueObjects/tweetWithContent'
import { setDuration } from '#helpers/time'
import type { DownloadSettings, FeatureSettings } from '#schema'
import { isErrorResult, isSuccessResult } from '#utils/result'
import { metrics } from '@sentry/browser'

type DownloadTweetMediaCommand = {
  tweetInfo: TweetInfo
  xTransactionIdProvider?: TransactionIdProvider
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
  tweetCacheRepo: ICache<TweetWithContent> | ICache<Tweet>
  downloaderBuilder: DownloaderBuilderMap
  eventPublisher: DomainEventPublisher
  solutionProvider: () => FetchTweetSolution
}

export class DownloadTweetMedia implements AsyncUseCase<
  DownloadTweetMediaCommand,
  boolean
> {
  constructor(readonly infra: InfraProvider) {}

  async process({
    tweetInfo,
    xTransactionIdProvider,
  }: DownloadTweetMediaCommand): Promise<boolean> {
    if (__METRICS__) metrics.count('usecase.downloadTweetMedia.invoked', 1)
    const isSuccessDownloadFromCache = await this.downloadFromCache(tweetInfo)
    if (isSuccessDownloadFromCache) return this.successDownloadFromCache()

    if (__METRICS__) metrics.count('usecase.downloadTweetMedia.cacheMiss', 1)
    const solution = this.infra.solutionProvider()
    const solutionDuration = setDuration()
    const tweetResult = isTransactionIdConsumer(solution)
      ? await solution.process({
          tweetId: tweetInfo.tweetId,
          transactionIdProvider: xTransactionIdProvider,
        })
      : await solution.process({
          tweetId: tweetInfo.tweetId,
        })

    if (__METRICS__) {
      metrics.count(
        isSuccessResult(tweetResult)
          ? 'usecase.downloadTweetMedia.solution.success'
          : 'usecase.downloadTweetMedia.solution.failed',
        1
      )
      metrics.distribution(
        'usecase.downloadTweetMedia.solution.duration',
        solutionDuration.end(),
        { unit: 'millisecond' }
      )
    }
    await this.infra.eventPublisher.publishAll(...solution.events)
    await this.reportSolutionStatistics(solution.statistics)

    return isErrorResult(tweetResult)
      ? this.failDownload(tweetResult.error, tweetInfo)
      : this.processDownload(tweetInfo, tweetResult.value)
  }

  private async successDownloadFromCache(): Promise<boolean> {
    if (__METRICS__) metrics.count('usecase.downloadTweetMedia.cacheHit', 1)
    return true
  }

  private async downloadFromCache(tweetInfo: TweetInfo): Promise<boolean> {
    const { value: tweet } = await this.infra.tweetCacheRepo.get(
      tweetInfo.tweetId
    )
    if (!tweet) return false

    if (__DEV__)
      // eslint-disable-next-line no-console
      console.debug(`Get tweet from injection cache (id: ${tweet.id})`)

    const tweetVo =
      tweet instanceof Tweet ? tweet : tweet.mapBy(props => props.tweet)

    return this.processDownload(tweetInfo, tweetVo)
  }

  private async processDownload(tweetInfo: TweetInfo, tweet: Tweet) {
    await this.saveDownloadHistory(tweetToDownloadHistory(tweet))

    const downloader = await this.buildDownloader(tweetInfo)
    const downloadCommands = await this.createDownloadCommands(tweet)

    await Promise.allSettled(
      downloadCommands.map(command => downloader.process(command))
    )

    await this.infra.eventPublisher.publishAll(...downloader.events)
    if (__METRICS__)
      if (downloader.isOk) {
        metrics.count('usecase.downloadTweetMedia.success', 1)
      } else {
        metrics.count('usecase.downloadTweetMedia.failed', 1, {
          attributes: { tweetId: tweetInfo.tweetId },
        })
      }

    return downloader.isOk
  }

  private async createDownloadCommands(tweet: Tweet) {
    const filenameSetting = await this.infra.filenameSettingRepo.get()
    const { includeVideoThumbnail } = await this.infra.featureSettingsRepo.get()

    return tweetToAvailableTweetMediaFiles(tweet)
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
    } else if (error instanceof InsufficientQuota) {
      if (error.isInternalControl === false)
        await this.infra.eventPublisher.publish(
          new TweetApiFailed(tweetInfo, 429)
        )
    } else if (error instanceof TweetProcessingError) {
      await this.infra.eventPublisher.publish(new TweetParsingFailed(tweetInfo))
    } else {
      // TODO: Handle other errors
      // eslint-disable-next-line no-console
      console.error('An unexpected error occurred', error)
    }

    if (__METRICS__)
      metrics.count('usecase.downloadTweetMedia.failed', 1, {
        attributes: { error: error.name, tweetId: tweetInfo.tweetId },
      })

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

  private async reportSolutionStatistics(statistics: SolutionStatistics) {
    // TODO: report statistics
    // eslint-disable-next-line no-console
    if (__DEV__) console.debug('Solution stats\n', JSON.stringify(statistics))
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
