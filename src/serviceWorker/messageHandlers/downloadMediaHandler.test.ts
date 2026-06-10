import { Tweet } from '#domain/valueObjects/tweet'
import { TweetUser } from '#domain/valueObjects/tweetUser'
import { DownloadTweetMediaMessage } from '#libs/webExtMessage'
import { MockTweetResponseCache } from '#mocks/caches/tweetResponseCache'
import { MockEventPublisher } from '#mocks/eventPublisher'
import { MockDownloadHistoryRepository } from '#mocks/repositories/downloadHistory'
import { MockDownloadSettingsRepository } from '#mocks/repositories/downloadSettings'
import { MockFeatureSettingsRepository } from '#mocks/repositories/fetureSettings'
import { MockFilenameSettingRepository } from '#mocks/repositories/filenameSetting'
import { MockDownloadMediaFile } from '#mocks/useCases/downloadMediaFile'
import { MockFetchTweetSolution } from '#mocks/useCases/fetchTweetSolution'
import { toSuccessResult } from '#utils/result'
import type { DownloaderBuilderMap } from '../../applicationUseCases/downloadTweetMedia'
import type { MessageContext } from '../messageRouter'
import downloadMessageHandler from './downloadMediaHandler'
import type { Runtime } from 'webextension-polyfill'

describe('unit test for download media message handler', () => {
  const mockDownloadMediaFile = new MockDownloadMediaFile()
  const mockDownloaderBuilder: DownloaderBuilderMap = {
    aria2: () => mockDownloadMediaFile,
    browser: () => mockDownloadMediaFile,
  }
  const mockFetchTweetSolution = new MockFetchTweetSolution()
  const mockDownloadHistoryRepo = new MockDownloadHistoryRepository()

  const makeHandler = () =>
    downloadMessageHandler({
      downloadHistoryRepo: mockDownloadHistoryRepo,
      filenameSettingRepo: new MockFilenameSettingRepository(),
      downloadSettingsRepo: new MockDownloadSettingsRepository(),
      featureSettingsRepo: new MockFeatureSettingsRepository(),
      downloaderBuilder: mockDownloaderBuilder,
      eventPublisher: new MockEventPublisher(),
      tweetCacheRepo: new MockTweetResponseCache(),
      solutionProvider: () => mockFetchTweetSolution,
    })

  const mockTweet = new Tweet({
    id: '123',
    createdAt: new Date(),
    hashtags: [],
    user: new TweetUser({
      userId: 'user123',
      displayName: 'Test User',
      screenName: 'testuser',
      isProtected: false,
    }),
    images: [],
    videos: [],
  })

  const makeContext = (sender: Runtime.MessageSender): MessageContext => ({
    message: new DownloadTweetMediaMessage({
      tweetId: '123',
      screenName: 'testuser',
    }).toObject(),
    sender,
    response: jest.fn(),
  })

  afterEach(() => {
    jest.resetAllMocks()
    jest.restoreAllMocks()
  })

  it('should pass the sender tab id to the downloader when the sender is an x tab', async () => {
    jest
      .spyOn(mockFetchTweetSolution, 'process')
      .mockResolvedValueOnce(toSuccessResult(mockTweet))
    jest.spyOn(mockDownloadHistoryRepo, 'save').mockResolvedValueOnce(undefined)
    const browserDownloaderBuilder = jest.spyOn(
      mockDownloaderBuilder,
      'browser'
    )

    await makeHandler()(
      makeContext({
        tab: { id: 42, url: 'https://x.com/home' } as never,
      } as Runtime.MessageSender)
    )

    expect(browserDownloaderBuilder).toHaveBeenCalledWith(
      expect.objectContaining({ tabId: 42 })
    )
  })

  it('should not pass a tab id when the sender is not an x tab', async () => {
    jest
      .spyOn(mockFetchTweetSolution, 'process')
      .mockResolvedValueOnce(toSuccessResult(mockTweet))
    jest.spyOn(mockDownloadHistoryRepo, 'save').mockResolvedValueOnce(undefined)
    const browserDownloaderBuilder = jest.spyOn(
      mockDownloaderBuilder,
      'browser'
    )

    await makeHandler()(
      makeContext({
        tab: { id: 7, url: 'https://example.com/' } as never,
      } as Runtime.MessageSender)
    )

    expect(browserDownloaderBuilder).toHaveBeenCalledWith(
      expect.objectContaining({ tabId: undefined })
    )
  })
})
