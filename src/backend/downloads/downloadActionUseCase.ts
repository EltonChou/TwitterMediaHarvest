import { storageConfig } from '@backend/configurations'
import { createAllApiUseCasesByTweetId, MediaTweetUseCases, sortUseCasesByVersion } from '@backend/twitterApi/useCases'
import { TweetVO } from '@backend/twitterApi/valueObjects'
import type { DownloadHistoryMediaType, TwitterApiVersion } from '@schema'
import { addBreadcrumb, captureException } from '@sentry/browser'
import { NotFound, TooManyRequest, TwitterApiError, Unauthorized } from '../errors'
import { FetchErrorNotificationUseCase, InternalErrorNotificationUseCase } from '../notifications/notifyUseCases'
import MediaDownloader from './MediaDownloader'
import { TweetDownloadHistoryItem } from './models'

const sentryCapture = (err: Error) => {
  if (err instanceof NotFound || err instanceof TooManyRequest || err instanceof Unauthorized) return

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

    const { twitterApiVersion } = await storageConfig.twitterApiSettingsRepo.getSettings()
    const tweetUseCases = sortUseCasesByVersion(createAllApiUseCasesByTweetId(this.tweetInfo.tweetId))(
      twitterApiVersion
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

    const historyItem = makeDownloadHistoryItem(getMediaTypeFromMediaCatalog(mediaCatalog))(tweet)
    await storageConfig.downloadHistoryRepo.save(historyItem)

    const mediaDownloader = await MediaDownloader.build()
    await mediaDownloader.downloadMediasByMediaCatalog(tweet, mediaCatalog)
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

    const internalErrorNotifyUseCase = new InternalErrorNotificationUseCase(this.tweetInfo)
    await internalErrorNotifyUseCase.notify(err)
  }
}

const makeDownloadHistoryItem = (mediaType: DownloadHistoryMediaType) => (tweetDetail: TweetDetail) =>
  TweetDownloadHistoryItem.build({
    tweetId: tweetDetail.id,
    screenName: tweetDetail.screenName,
    displayName: tweetDetail.displayName,
    tweetTime: tweetDetail.createdAt,
    downloadTime: new Date(),
    mediaType: mediaType,
  })

const getMediaTypeFromMediaCatalog = (catalog: TweetMediaCatalog): DownloadHistoryMediaType => {
  const imgCount = catalog.images.length
  const vidCount = catalog.videos.length

  if (imgCount > 0 && vidCount > 0) return 'mixed'
  if (imgCount > 0) return 'image'
  if (imgCount > 0) return 'video'
  return 'mixed'
}
