import { storageConfig } from '@backend/configurations'
import {
  GraphQLTweetUseCase,
  ITweetUseCase,
  MediaTweetUseCases,
  V1TweetUseCase,
  V2TweetUseCase,
} from '@backend/twitterApi/useCases'
import { addBreadcrumb, captureException } from '@sentry/browser'
import { NotFound, TooManyRequest, TwitterApiError, Unauthorized } from '../errors'
import { FetchErrorNotificationUseCase, InternalErrorNotificationUseCase } from '../notifications/notifyUseCase'
import MediaDownloader from './MediaDownloader'

const sentryCapture = (err: Error) => {
  if (err instanceof NotFound || err instanceof TooManyRequest || err instanceof Unauthorized) return

  captureException(err)
}

const selectTweetUseCase = async (tweetId: string): Promise<ITweetUseCase> => {
  const { twitterApiVersion } = await storageConfig.twitterApiSettingsRepo.getSettings()

  switch (twitterApiVersion) {
    case 'v1':
      return new V1TweetUseCase(tweetId)

    case 'v2':
      return new V2TweetUseCase(tweetId)

    case 'gql':
      return new GraphQLTweetUseCase(tweetId)

    default:
      return new V2TweetUseCase(tweetId)
  }
}

export default class DownloadActionUseCase {
  constructor(readonly tweetInfo: TweetInfo) {}

  /* eslint-disable no-console */
  private async process(): Promise<void> {
    console.info('Processing download. Info:', this.tweetInfo)
    addBreadcrumb({
      category: 'download',
      message: 'Process download.',
      level: 'info',
    })

    const mediaDownloader = await MediaDownloader.build(this.tweetInfo)
    const tweetUseCase = await selectTweetUseCase(this.tweetInfo.tweetId)
    const mediaTweetUseCase = new MediaTweetUseCases(tweetUseCase)
    console.info(`Fetching media info (tweetId: ${this.tweetInfo.tweetId})...`)
    const mediaCatelog = await mediaTweetUseCase.fetchMediaCatalog()
    mediaDownloader.downloadMediasByMediaCatalog(mediaCatelog)
  }

  async processDownload(): Promise<void> {
    try {
      await this.process()
    } catch (err) {
      this.handleError(err)
      throw err
    }
  }
  /* eslint-disable no-console */

  private handleError(err: Error): Promise<void> {
    console.error('Error reason: ', err)
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
