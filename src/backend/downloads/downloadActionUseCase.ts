import { storageConfig } from '@backend/configurations'
import {
  FallbackGraphQLTweetUseCase,
  ITweetUseCase,
  LatestGraphQLTweetUseCase,
  MediaTweetUseCases,
  V1TweetUseCase,
  V2TweetUseCase,
} from '@backend/twitterApi/useCases'
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

const sortUseCasesByVersion =
  (priorityVersion: TwitterApiVersion) =>
  async (useCases: ITweetUseCase[]): Promise<ITweetUseCase[]> =>
    [...useCases].sort((a, b) => {
      if (a.version === priorityVersion) return -1
      if (b.version === priorityVersion) return 1
      return 0
    })

const createAllApiUseCasesByTweetId = (tweetId: string): ITweetUseCase[] => [
  new V1TweetUseCase(tweetId),
  new V2TweetUseCase(tweetId),
  new LatestGraphQLTweetUseCase(tweetId),
  new FallbackGraphQLTweetUseCase(tweetId),
]

/* eslint-disable no-console */
const logDownloadProcess = (tweetInfo: TweetInfo) => {
  console.info('Processing download.\n', tweetInfo)
  addBreadcrumb({
    category: 'download',
    message: 'Process download.',
    level: 'info',
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
    let isInfoFetched = false
    while (tweetUseCases.length > 0 && !isInfoFetched) {
      const tweetUseCase = tweetUseCases.shift()
      const mediaTweetUseCase = new MediaTweetUseCases(tweetUseCase)
      logMediaFetch(tweetUseCase.version, this.tweetInfo.tweetId)

      try {
        tweet = await mediaTweetUseCase.fetchTweet()
        mediaCatalog = await mediaTweetUseCase.fetchMediaCatalog()
        isInfoFetched = true
      } catch (error) {
        err = error
        if (tweetUseCases.length === 0 && err) throw error
      }
    }

    const tweetDetail: TweetDetail = {
      id: tweet.id,
      userId: tweet.authorId,
      createdAt: tweet.createdAt,
      displayName: tweet.authorName,
      screenName: tweet.authorScreenName,
    }
    const mediaDownloader = await MediaDownloader.build()
    await mediaDownloader.downloadMediasByMediaCatalog(tweetDetail, mediaCatalog)
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
    console.error('Error reason: ', err)
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
