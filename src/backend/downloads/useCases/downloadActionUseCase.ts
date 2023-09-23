import { NotFound, TooManyRequest, TwitterApiError, Unauthorized } from '../../errors'
import {
  FetchErrorNotificationUseCase,
  InternalErrorNotificationUseCase,
} from '../../notifications/notifyUseCases'
import MediaDownloader from '../MediaDownloader'
import { DownloadHistoryEntity } from '../models'
import {
  downloadHistoryRepo,
  downloadRecordRepo,
  downloadSettingsRepo,
  featureSettingsRepo,
  hashtagRepo,
  twitterApiSettingsRepo,
  v4FilenameSettingsRepo,
} from '@backend/configurations'
import {
  MediaTweetUseCases,
  createAllApiUseCasesByTweetId,
  sortUseCasesByVersion,
} from '@backend/twitterApi/useCases'
import { TweetVO } from '@backend/twitterApi/valueObjects'
import type { DownloadHistoryMediaType, TwitterApiVersion } from '@schema'
import { addBreadcrumb, captureException } from '@sentry/browser'

const sentryCapture = (err: Error) => {
  if (
    err instanceof NotFound ||
    err instanceof TooManyRequest ||
    err instanceof Unauthorized
  )
    return

  captureException(err)
}

/* eslint-disable no-console */
const logDownloadProcess = (tweetInfo: TweetInfo) => {
  console.info('Processing download.\n', tweetInfo)
  addBreadcrumb({
    category: 'download',
    message: 'Process download.',
    level: 'info',
    data: tweetInfo,
  })
}

const logMediaFetch = (apiVersion: TwitterApiVersion, tweetId: string) => {
  const data = {
    tweetId: tweetId,
  }
  console.info(`Fetching media info. (${apiVersion})\n`, data)
  addBreadcrumb({
    category: 'download',
    message: 'Fetching media info.',
    level: 'info',
    data: data,
  })
}
/* eslint-disable no-console */

export default class DownloadActionUseCase {
  constructor(readonly tweetInfo: TweetInfo) {}

  private async process(): Promise<void> {
    let tweet: TweetVO = undefined
    let mediaCatalog: TweetMediaCatalog = undefined

    logDownloadProcess(this.tweetInfo)

    const { twitterApiVersion } = await twitterApiSettingsRepo.getSettings()
    const tweetUseCases = sortUseCasesByVersion(twitterApiVersion)(
      createAllApiUseCasesByTweetId(this.tweetInfo.tweetId)
    )

    let err: Error = undefined
    while (tweetUseCases.length > 0 && mediaCatalog === undefined) {
      const tweetUseCase = tweetUseCases.shift()
      const mediaTweetUseCase = new MediaTweetUseCases(tweetUseCase)
      logMediaFetch(tweetUseCase.version, this.tweetInfo.tweetId)

      try {
        tweet = await mediaTweetUseCase.fetchTweet()
        mediaCatalog = await mediaTweetUseCase.fetchMediaCatalog()
      } catch (error) {
        err = error
      }
    }

    if (mediaCatalog === undefined) throw err

    await hashtagRepo.addTweet(tweet.id)(...tweet.hashtags)
    const historyItem = makeDownloadHistoryItem(mediaCatalog)(tweet)
    await downloadHistoryRepo.save(historyItem)

    const fileNameSettings = await v4FilenameSettingsRepo.getSettings()
    const downloadSettings = await downloadSettingsRepo.getSettings()
    const featureSettings = await featureSettingsRepo.getSettings()
    const mediaDownloader = new MediaDownloader(
      fileNameSettings,
      downloadSettings,
      featureSettings,
      downloadRecordRepo
    )
    await mediaDownloader.downloadMediasByMediaCatalog(tweet)(mediaCatalog)
  }

  async processDownload(): Promise<'success' | 'error'> {
    try {
      await this.process()
      return 'success'
    } catch (err) {
      await this.handleError(err)
      return 'error'
    }
  }

  private async handleError(err: Error): Promise<void> {
    console.error(err)
    sentryCapture(err)

    if (err instanceof TwitterApiError) {
      const fetchErrorUseCase = new FetchErrorNotificationUseCase(this.tweetInfo)
      await fetchErrorUseCase.notify(err)
      return
    }

    const internalErrorNotifyUseCase = new InternalErrorNotificationUseCase(
      this.tweetInfo
    )
    await internalErrorNotifyUseCase.notify(err)
  }
}

const makeDownloadHistoryItem =
  (catalog: TweetMediaCatalog) => (tweetDetail: TweetDetail) =>
    DownloadHistoryEntity.build({
      tweetId: tweetDetail.id,
      screenName: tweetDetail.screenName,
      displayName: tweetDetail.displayName,
      tweetTime: tweetDetail.createdAt,
      downloadTime: new Date(),
      mediaType: parseMediaTypeFromMediaCatalog(catalog),
      thumbnail: catalog.images.at(0),
      userId: tweetDetail.userId,
    })

const parseMediaTypeFromMediaCatalog = (
  catalog: TweetMediaCatalog
): DownloadHistoryMediaType => {
  const imgCount = catalog.images.length
  const vidCount = catalog.videos.length

  if (vidCount === 0) return 'image'
  if (vidCount > 0 && imgCount === 1) return 'video'
  return 'mixed'
}
