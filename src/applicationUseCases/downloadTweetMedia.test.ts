import TweetApiFailed from '#domain/events/TweetApiFailed'
import TweetParsingFailed from '#domain/events/TweetParsingFailed'
import {
  InsufficientQuota,
  NoValidSolutionToken,
  TweetIsNotFound,
  TweetProcessingError,
} from '#domain/useCases/fetchTweetSolution'
import { FilenameSetting } from '#domain/valueObjects/filenameSetting'
import { AggregationToken } from '#domain/valueObjects/filenameSetting'
import { Tweet } from '#domain/valueObjects/tweet'
import { TweetInfo } from '#domain/valueObjects/tweetInfo'
import { TweetUser } from '#domain/valueObjects/tweetUser'
import { TweetWithContent } from '#domain/valueObjects/tweetWithContent'
import PatternToken from '#enums/patternToken'
import { MockTweetResponseCache } from '#mocks/caches/tweetResponseCache'
import { MockEventPublisher } from '#mocks/eventPublisher'
import { MockDownloadHistoryRepository } from '#mocks/repositories/downloadHistory'
import { MockDownloadSettingsRepository } from '#mocks/repositories/downloadSettings'
import { MockFeatureSettingsRepository } from '#mocks/repositories/fetureSettings'
import { MockFilenameSettingRepository } from '#mocks/repositories/filenameSetting'
import { MockDownloadMediaFile } from '#mocks/useCases/downloadMediaFile'
import { MockFetchTweetSolution } from '#mocks/useCases/fetchTweetSolution'
import { toErrorResult, toSuccessResult } from '#utils/result'
import { generateDownloadSettings } from '#utils/test/downloadSettings'
import { generateTweet } from '#utils/test/tweet'
import { DownloadTweetMedia } from './downloadTweetMedia'
import type { DownloaderBuilderMap } from './downloadTweetMedia'

describe('DownloadTweetMedia', () => {
  const mockDownloadHistoryRepo = new MockDownloadHistoryRepository()
  const mockFilenameSettingRepo = new MockFilenameSettingRepository()
  const mockDownloadSettingsRepo = new MockDownloadSettingsRepository()
  const mockFeatureSettingsRepo = new MockFeatureSettingsRepository()
  const mockDownloadMediaFile = new MockDownloadMediaFile()
  const mockTweetResponseCache = new MockTweetResponseCache()
  const mockDownloaderBuilder: DownloaderBuilderMap = {
    aria2: () => mockDownloadMediaFile,
    browser: () => mockDownloadMediaFile,
  }
  const mockEventPublisher = new MockEventPublisher()
  const mockNativeFetchTweetSolution = new MockFetchTweetSolution()
  const mockXTransactionIdProvider = async () => toSuccessResult('')

  const downloadTweetMedia = new DownloadTweetMedia({
    downloadHistoryRepo: mockDownloadHistoryRepo,
    filenameSettingRepo: mockFilenameSettingRepo,
    downloadSettingsRepo: mockDownloadSettingsRepo,
    featureSettingsRepo: mockFeatureSettingsRepo,
    downloaderBuilder: mockDownloaderBuilder,
    eventPublisher: mockEventPublisher,
    tweetCacheRepo: mockTweetResponseCache,
    solutionProvider: () => mockNativeFetchTweetSolution,
  })

  const mockTweetUser = new TweetUser({
    userId: 'user123',
    displayName: 'Test User',
    screenName: 'testuser',
    isProtected: false,
  })

  const mockTweet = new Tweet({
    id: '123',
    createdAt: new Date(),
    hashtags: ['test'],
    user: mockTweetUser,
    images: [],
    videos: [],
  })

  const mockTweetInfo = new TweetInfo({
    screenName: 'testuser',
    tweetId: '123',
  })

  const _mockFilenameSetting = new FilenameSetting({
    directory: 'downloads',
    groupBy: AggregationToken.Account,
    fileAggregation: true,
    noSubDirectory: false,
    filenamePattern: [
      PatternToken.Account,
      PatternToken.TweetId,
      PatternToken.Serial,
    ],
  })

  afterEach(() => {
    jest.resetAllMocks()
    jest.restoreAllMocks()
  })

  describe('process', () => {
    it('should successfully download tweet using browser downloader', async () => {
      jest
        .spyOn(mockNativeFetchTweetSolution, 'process')
        .mockResolvedValueOnce(toSuccessResult(mockTweet))

      const mockhistorySave = jest
        .spyOn(mockDownloadHistoryRepo, 'save')
        .mockResolvedValueOnce()

      const browserDownloaderBuilder = jest.spyOn(
        mockDownloaderBuilder,
        'browser'
      )
      const mockPublishAll = jest.spyOn(mockEventPublisher, 'publishAll')

      // Act
      const result = await downloadTweetMedia.process({
        tweetInfo: mockTweetInfo,
        xTransactionIdProvider: mockXTransactionIdProvider,
      })

      // Assert
      expect(result).toBe(true)
      expect(mockhistorySave).toHaveBeenCalled()
      expect(mockPublishAll).toHaveBeenCalled()
      expect(browserDownloaderBuilder).toHaveBeenCalled()

      browserDownloaderBuilder.mockRestore()
      browserDownloaderBuilder.mockReset()
    })

    it('should successfully download tweet using aria2 downloader', async () => {
      // Arrange
      jest.spyOn(mockDownloadSettingsRepo, 'get').mockResolvedValueOnce({
        ...generateDownloadSettings(),
        enableAria2: true,
        askWhereToSave: true,
      })

      jest.spyOn(mockDownloadHistoryRepo, 'save').mockResolvedValueOnce()

      const mockAria2DownloadBuilder = jest.spyOn(
        mockDownloaderBuilder,
        'aria2'
      )

      jest
        .spyOn(mockNativeFetchTweetSolution, 'process')
        .mockResolvedValueOnce(toSuccessResult(mockTweet))

      // Act
      const result = await downloadTweetMedia.process({
        tweetInfo: mockTweetInfo,
        xTransactionIdProvider: mockXTransactionIdProvider,
      })

      // Assert
      expect(result).toBe(true)
      expect(mockAria2DownloadBuilder).toHaveBeenCalled()
    })

    it('should handle tweet not found error', async () => {
      // Arrange
      const mockPublish = jest.spyOn(mockEventPublisher, 'publish')
      jest
        .spyOn(mockNativeFetchTweetSolution, 'process')
        .mockResolvedValueOnce(
          toErrorResult(new TweetIsNotFound('Tweet not found'))
        )

      // Act
      const result = await downloadTweetMedia.process({
        tweetInfo: mockTweetInfo,
        xTransactionIdProvider: mockXTransactionIdProvider,
      })

      // Assert
      expect(result).toBe(false)
      expect(mockPublish).toHaveBeenCalledWith(expect.any(TweetApiFailed))
    })

    it('should handle invalid token error', async () => {
      // Arrange
      const mockPublish = jest.spyOn(mockEventPublisher, 'publish')
      jest
        .spyOn(mockNativeFetchTweetSolution, 'process')
        .mockResolvedValueOnce(
          toErrorResult(new NoValidSolutionToken('Invalid token'))
        )

      // Act
      const result = await downloadTweetMedia.process({
        tweetInfo: mockTweetInfo,
        xTransactionIdProvider: mockXTransactionIdProvider,
      })

      // Assert
      expect(result).toBe(false)
      expect(mockPublish).toHaveBeenCalledWith(expect.any(TweetApiFailed))
    })

    it('should handle insufficient quota error', async () => {
      // Arrange
      const mockPublish = jest.spyOn(mockEventPublisher, 'publish')
      jest
        .spyOn(mockNativeFetchTweetSolution, 'process')
        .mockResolvedValueOnce(
          toErrorResult(new InsufficientQuota('Rate limit exceeded'))
        )

      // Act
      const result = await downloadTweetMedia.process({
        tweetInfo: mockTweetInfo,
        xTransactionIdProvider: mockXTransactionIdProvider,
      })

      // Assert
      expect(result).toBe(false)
      expect(mockPublish).toHaveBeenCalledWith(expect.any(TweetApiFailed))
    })

    it('should handle tweet processing error', async () => {
      // Arrange
      const mockPublish = jest.spyOn(mockEventPublisher, 'publish')
      jest
        .spyOn(mockNativeFetchTweetSolution, 'process')
        .mockResolvedValueOnce(
          toErrorResult(new TweetProcessingError('Failed to parse tweet'))
        )

      // Act
      const result = await downloadTweetMedia.process({
        tweetInfo: mockTweetInfo,
        xTransactionIdProvider: mockXTransactionIdProvider,
      })

      // Assert
      expect(result).toBe(false)
      expect(mockPublish).toHaveBeenCalledWith(expect.any(TweetParsingFailed))
    })

    it('should handle download history save error gracefully', async () => {
      // Arrange
      jest
        .spyOn(mockNativeFetchTweetSolution, 'process')
        .mockResolvedValueOnce(toSuccessResult(mockTweet))
      jest
        .spyOn(mockDownloadSettingsRepo, 'get')
        .mockResolvedValueOnce(generateDownloadSettings())

      jest
        .spyOn(mockDownloadHistoryRepo, 'save')
        .mockResolvedValueOnce(new Error('Save failed'))

      // Act
      const result = await downloadTweetMedia.process({
        tweetInfo: mockTweetInfo,
        xTransactionIdProvider: mockXTransactionIdProvider,
      })

      // Assert
      expect(result).toBe(true) // Should still succeed even if history save fails
    })

    it('should use tweet cache from cache repository', async () => {
      jest
        .spyOn(mockDownloadSettingsRepo, 'get')
        .mockResolvedValueOnce(generateDownloadSettings())

      jest.spyOn(mockDownloadMediaFile, 'process').mockResolvedValue()

      const mockCacheGet = jest
        .spyOn(mockTweetResponseCache, 'get')
        .mockResolvedValueOnce(
          toSuccessResult(
            new TweetWithContent({ tweet: generateTweet(), content: '' })
          )
        )

      const mockSolutionProcess = jest.spyOn(
        mockNativeFetchTweetSolution,
        'process'
      )
      const mockhistorySave = jest
        .spyOn(mockDownloadHistoryRepo, 'save')
        .mockResolvedValueOnce()

      jest.spyOn(mockEventPublisher, 'publishAll')
      const result = await downloadTweetMedia.process({
        tweetInfo: mockTweetInfo,
        xTransactionIdProvider: mockXTransactionIdProvider,
      })

      expect(result).toBeTrue()
      expect(mockhistorySave).toHaveBeenCalledOnce()
      expect(mockSolutionProcess).not.toHaveBeenCalled()
      expect(mockCacheGet).toHaveBeenCalledOnce()
    })
  })
})
