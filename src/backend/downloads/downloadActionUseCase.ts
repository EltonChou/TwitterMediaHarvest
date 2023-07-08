import { storageConfig } from '@backend/configurations'
import {
  FallbackGraphQLTweetUseCase,
  ITweetUseCase,
  LatestGraphQLTweetUseCase,
  MediaTweetUseCases,
  V1TweetUseCase,
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

const makeSortedUseCases = async (
  useCases: ITweetUseCase[],
  priorityVersion: TwitterApiVersion
): Promise<ITweetUseCase[]> =>
  [...useCases].sort((a, b) => {
    if (a.version === priorityVersion) return -1
    if (b.version === priorityVersion) return 1
    return 0
  })

export default class DownloadActionUseCase {
  constructor(readonly tweetInfo: TweetInfo) {}

  /* eslint-disable no-console */
  private async process(): Promise<void> {
    let tweet: TweetVO
    let mediaCatalog: TweetMediaCatalog

    console.info('Processing download. Info:', this.tweetInfo)
    addBreadcrumb({
      category: 'download',
      message: 'Process download.',
      level: 'info',
    })

    const { twitterApiVersion } = await storageConfig.twitterApiSettingsRepo.getSettings()
    const tweetApiUseCases = [
      new V1TweetUseCase(this.tweetInfo.tweetId),
      new LatestGraphQLTweetUseCase(this.tweetInfo.tweetId),
      new FallbackGraphQLTweetUseCase(this.tweetInfo.tweetId),
    ]
    const tweetUseCases = await makeSortedUseCases(tweetApiUseCases, twitterApiVersion)

    let err: Error = undefined
    let isInfoFetched = false
    while (tweetUseCases.length > 0 && !isInfoFetched) {
      const tweetUseCase = tweetUseCases.shift()
      const mediaTweetUseCase = new MediaTweetUseCases(tweetUseCase)
      console.info(`Fetching media info. (${tweetUseCase.version})\n`, {
        tweetId: this.tweetInfo.tweetId,
      })

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
    const mediaDownloader = await MediaDownloader.build(tweetDetail)
    await mediaDownloader.downloadMediasByMediaCatalog(mediaCatalog)
  }

  async processDownload(): Promise<void> {
    try {
      await this.process()
    } catch (err) {
      await this.handleError(err)
      throw err
    }
  }
  /* eslint-disable no-console */

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
