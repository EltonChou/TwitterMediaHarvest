import * as Sentry from '@sentry/browser'
import MediaDownloader from './MediaDownloader'
import { fetchMediaCatalog } from '../twitterApi/MediaTweet'
import { TwitterApiError, Unauthorized } from '../errors'
import {
  FetchErrorNotificationUseCase,
  InternalErrorNotificationUseCase
} from '../notifications/notifyUseCase'
import { NotFound, TooManyRequest } from '../errors'


const sentryCapture = (err: Error) => {
  if (
    err instanceof NotFound ||
    err instanceof TooManyRequest ||
    err instanceof Unauthorized
  ) return

  Sentry.captureException(err)
}

export default class DownloadActionUseCase {
  readonly tweetInfo: TweetInfo

  constructor(tweetInfo: TweetInfo) {
    this.tweetInfo = tweetInfo
  }

  /* eslint-disable no-console */
  private async process(): Promise<void> {
    console.info('Processing download. Info:', this.tweetInfo)
    Sentry.addBreadcrumb({
      category: 'download',
      message: 'Process download.',
      level: 'info',
    })

    const mediaDownloader = await MediaDownloader.build(this.tweetInfo)
    console.info(`Fetching media info (tweetId: ${this.tweetInfo.tweetId})...`)
    const mediaCatelog = await fetchMediaCatalog(this.tweetInfo.tweetId)
    mediaDownloader.downloadMediasByMediaCatalog(mediaCatelog)
  }

  async processDownload(): Promise<void> {
    try {
      await this.process()
      // onSuccess()
    } catch (err) {
      console.error('Error reason: ', err)
      this.handleError(err)
      throw err
    }
  }
  /* eslint-disable no-console */

  private handleError(err: Error): Promise<void> {
    sentryCapture(err)

    if (err instanceof TwitterApiError) {
      const fetchErrorUseCase = new FetchErrorNotificationUseCase(this.tweetInfo)
      fetchErrorUseCase.notify(err)
      return
    }

    const internalErrorNotifyUseCase = new InternalErrorNotificationUseCase(this.tweetInfo)
    internalErrorNotifyUseCase.notify(err)
  }
}