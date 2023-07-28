import { storageConfig } from '@backend/configurations'
import { createAllApiUseCasesByTweetId, MediaTweetUseCases, sortUseCasesByVersion } from '@backend/twitterApi/useCases'
import { TweetVO } from '@backend/twitterApi/valueObjects'
import { TwitterApiVersion } from '@schema'
import { addBreadcrumb, captureException } from '@sentry/browser'
import { NotFound, TooManyRequest, TwitterApiError, Unauthorized } from '../errors'
import { FetchErrorNotificationUseCase, InternalErrorNotificationUseCase } from '../notifications/notifyUseCases'
import MediaDownloader from './MediaDownloader'

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
  console.info(`Fetching media info. (${apiVersion})\n`, {
    tweetId: tweetId,
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
    const tweetUseCases = await sortUseCasesByVersion(twitterApiVersion)(
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

    const mediaDownloader = await MediaDownloader.build()
    await mediaDownloader.downloadMediasByMediaCatalog(tweet, mediaCatalog)
  }

  async processDownload(): Promise<void> {
    try {
      await this.process()
    } catch (err) {
      await this.handleError(err)
      throw err
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
