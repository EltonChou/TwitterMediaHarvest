import TweetApiFailed from '#domain/events/TweetApiFailed'
import TweetParsingFailed from '#domain/events/TweetParsingFailed'
import { tweetToDownloadHistory } from '#domain/factories/tweetToDownloadHistory'
import { tweetToTweetMediaFiles } from '#domain/factories/tweetToTweetMediaFiles'
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
import type { SaveDownloadHistory } from '#domain/useCases/saveDownloadHistory'
import { DownloadTarget } from '#domain/valueObjects/downloadTarget'
import type { FilenameSetting } from '#domain/valueObjects/filenameSetting'
import type { Tweet } from '#domain/valueObjects/tweet'
import type { TweetInfo } from '#domain/valueObjects/tweetInfo'
import { TweetMediaFile } from '#domain/valueObjects/tweetMediaFile'
import { getEventPublisher } from '#infra/eventPublisher'
import type { DownloadSettings, FeatureSettings } from '#schema'

type DownloadTweetMediaCommand = {
  tweetInfo: TweetInfo
}

type DownloaderBuilderMap = {
  browser: DownloadMediaFileUseCaseBuilder
  aria2: DownloadMediaFileUseCaseBuilder
}

type FetchTweetMap = {
  latest: FetchTweet
  fallback: FetchTweet
  guest: FetchTweet
}

// TODO: Logger and Tracker (like sentry).
export class DownloadTweetMedia
  implements AsyncUseCase<DownloadTweetMediaCommand, boolean>
{
  constructor(
    readonly tokenRepo: ITwitterTokenRepository,
    readonly fetchTweet: FetchTweetMap,
    readonly saveDownloadHistory: SaveDownloadHistory,
    readonly filenameSettingRepo: ISettingsVORepository<FilenameSetting>,
    readonly downloadSettingsRepo: ISettingsRepository<DownloadSettings>,
    readonly featureSettingsRepo: ISettingsRepository<FeatureSettings>,
    readonly downloaderBuilder: DownloaderBuilderMap
  ) {}

  async process(command: DownloadTweetMediaCommand): Promise<boolean> {
    const eventPublisher = getEventPublisher()
    const csrfToken = await this.tokenRepo.getCsrfToken()
    const guestToken = await this.tokenRepo.getGuestToken()

    if (!csrfToken && !guestToken) {
      const event = new TweetApiFailed(command.tweetInfo, 401)
      eventPublisher.publish(event)
      return false
    }

    const fetchTweetSolutions: [FetchTweet, FetchTweetCommand][] = []

    // TODO: Should we prefer guest endpoin to prevent consume api quota?
    if (csrfToken) {
      const fetchTweetCommand = {
        csrfToken: csrfToken.value,
        tweetId: command.tweetInfo.tweetId,
      }
      fetchTweetSolutions.push(
        [this.fetchTweet.latest, fetchTweetCommand],
        [this.fetchTweet.fallback, fetchTweetCommand]
      )
    }

    if (guestToken) {
      const fetchTweetCommand = {
        csrfToken: guestToken.value,
        tweetId: command.tweetInfo.tweetId,
      }
      fetchTweetSolutions.push([this.fetchTweet.guest, fetchTweetCommand])
    }

    let result: Result<Tweet> | undefined = undefined

    for (const [fetchTweet, fetchTweetCommand] of fetchTweetSolutions) {
      if (result?.value) break
      result = await fetchTweet.process(fetchTweetCommand)
    }

    // Ensure result type.
    if (!result) return false

    if (result.error) {
      const fetchTweetError = result.error

      if (fetchTweetError instanceof ParseTweetError) {
        const event = new TweetParsingFailed(command.tweetInfo)
        eventPublisher.publish(event)
        return false
      }

      if (fetchTweetError instanceof FetchTweetError) {
        const event = new TweetApiFailed(command.tweetInfo, fetchTweetError.statusCode)
        eventPublisher.publish(event)
        return false
      }

      const event = new TweetApiFailed(command.tweetInfo, 500)
      eventPublisher.publish(event)
      return false
    }

    try {
      const downloadHistory = tweetToDownloadHistory(result.value)
      await this.saveDownloadHistory.process({ downloadHistory: downloadHistory })
    } catch (error) {
      // TODO: Record error.
    }

    const downloadSettings = await this.downloadSettingsRepo.get()
    const filenameSetting = await this.filenameSettingRepo.get()
    const featureSettings = await this.featureSettingsRepo.get()

    const downloader = (
      downloadSettings.enableAria2
        ? this.downloaderBuilder.aria2
        : this.downloaderBuilder.browser
    )({
      targetTweet: command.tweetInfo,
      shouldPrompt: downloadSettings.askWhereToSave,
    })

    await Promise.allSettled(
      tweetToTweetMediaFiles(result.value)
        .filter(
          mediaFile => featureSettings.includeVideoThumbnail || !mediaFile.isThumbnail
        )
        .map(tweetMediaFileToDownloadTargetWithFilenameSettting(filenameSetting))
        .map(downloadTargetToDownloadCommand)
        .map(downloader.process)
    )
    eventPublisher.publishAll(...downloader.events)

    return downloader.isOk
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
