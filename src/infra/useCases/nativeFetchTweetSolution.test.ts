import SolutionQuotaInsufficient from '#domain/events/NativeTweetSolutionQuotaInsufficient'
import type { ITwitterTokenRepository } from '#domain/repositories/twitterToken'
import {
  InsufficientQuota,
  NoValidSolutionToken,
  TweetIsNotFound,
  TweetProcessingError,
} from '#domain/useCases/fetchTweetSolution'
import { TwitterToken } from '#domain/valueObjects/twitterToken'
import type { ApiClient as XApiClient } from '#libs/XApi'
import { FetchTweetError, ParseTweetError } from '#libs/XApi'
import { generateTweet } from '#utils/test/tweet'
import { NativeFetchTweetSolution } from './nativeFetchTweetSolution'

// Mock the caches API
global.caches = {
  open: jest.fn().mockResolvedValue({
    match: jest.fn(),
    put: jest.fn(),
  }),
} as unknown as CacheStorage

describe('NativeFetchTweetSolution', () => {
  let mockXTokenRepo: ITwitterTokenRepository
  let mockXApiClient: XApiClient
  let solution: NativeFetchTweetSolution

  const mockTweet = generateTweet()

  const mockTweetResult = {
    value: mockTweet,
    error: undefined,
  }

  const mockCommandOutput = {
    $metadata: {
      remainingQuota: 100,
      quotaResetTime: new Date(),
    },
    tweetResult: mockTweetResult,
  }

  beforeEach(() => {
    mockXTokenRepo = {
      getCsrfToken: jest.fn(),
      getGuestToken: jest.fn(),
      getByName: jest.fn(),
    }

    mockXApiClient = {
      exec: jest.fn(),
      config: {},
      makeCacheResult: jest.fn(),
    }

    solution = new NativeFetchTweetSolution(
      {
        xTokenRepo: mockXTokenRepo,
        xApiClient: mockXApiClient,
      },
      { quotaThreshold: 50 }
    )
  })

  describe('process', () => {
    it('should successfully fetch tweet using guest token', async () => {
      // Arrange
      const guestToken = new TwitterToken({
        name: 'guest',
        value: 'guest-token',
      })
      jest.mocked(mockXTokenRepo.getGuestToken).mockResolvedValue(guestToken)
      jest
        .mocked(mockXApiClient.exec)
        .mockResolvedValue({ value: mockCommandOutput, error: undefined })

      // Act
      const result = await solution.process({ tweetId: '123' })

      // Assert
      expect(result.tweetResult.value).toBeDefined()
      expect(result.tweetResult.error).toBeUndefined()
      expect(result.statistics.guest).toBeDefined()
      expect(result.statistics.general).toBeUndefined()
      expect(result.statistics.fallback).toBeUndefined()
    })

    it('should fall back to general token when guest token fails', async () => {
      // Arrange
      const csrfToken = new TwitterToken({ name: 'csrf', value: 'csrf-token' })
      jest.mocked(mockXTokenRepo.getGuestToken).mockResolvedValue(undefined)
      jest.mocked(mockXTokenRepo.getCsrfToken).mockResolvedValue(csrfToken)
      jest
        .mocked(mockXApiClient.exec)
        .mockResolvedValueOnce({
          value: undefined,
          error: new Error('Guest token failed'),
        })
        .mockResolvedValueOnce({ value: mockCommandOutput, error: undefined })

      // Act
      const result = await solution.process({ tweetId: '123' })

      // Assert
      expect(result.tweetResult.value).toBeDefined()
      expect(result.tweetResult.error).toBeUndefined()
      expect(result.statistics.general).toBeDefined()
    })

    it('should handle rate limit exceeded error', async () => {
      // Arrange
      const csrfToken = new TwitterToken({ name: 'csrf', value: 'csrf-token' })
      jest.mocked(mockXTokenRepo.getGuestToken).mockResolvedValue(undefined)
      jest.mocked(mockXTokenRepo.getCsrfToken).mockResolvedValue(csrfToken)
      jest.mocked(mockXApiClient.exec).mockResolvedValue({
        value: undefined,
        error: new FetchTweetError('Rate limit exceeded', 429),
      })

      // Act
      const result = await solution.process({ tweetId: '123' })

      // Assert
      expect(result.tweetResult.error).toBeInstanceOf(InsufficientQuota)
    })

    it('should handle tweet not found error', async () => {
      // Arrange
      const csrfToken = new TwitterToken({ name: 'csrf', value: 'csrf-token' })
      jest.mocked(mockXTokenRepo.getGuestToken).mockResolvedValue(undefined)
      jest.mocked(mockXTokenRepo.getCsrfToken).mockResolvedValue(csrfToken)
      jest.mocked(mockXApiClient.exec).mockResolvedValue({
        value: undefined,
        error: new FetchTweetError('Tweet not found', 404),
      })

      // Act
      const result = await solution.process({ tweetId: '123' })

      // Assert
      expect(result.tweetResult.error).toBeInstanceOf(TweetIsNotFound)
    })

    it('should handle parse error', async () => {
      // Arrange
      const csrfToken = new TwitterToken({ name: 'csrf', value: 'csrf-token' })
      jest.mocked(mockXTokenRepo.getGuestToken).mockResolvedValue(undefined)
      jest.mocked(mockXTokenRepo.getCsrfToken).mockResolvedValue(csrfToken)
      jest.mocked(mockXApiClient.exec).mockResolvedValue({
        value: undefined,
        error: new ParseTweetError('Failed to parse'),
      })

      // Act
      const result = await solution.process({ tweetId: '123' })

      // Assert
      expect(result.tweetResult.error).toBeInstanceOf(TweetProcessingError)
    })

    it('should return quota shortage warning when quota is low', async () => {
      // Arrange
      const csrfToken = new TwitterToken({ name: 'csrf', value: 'csrf-token' })
      const lowQuotaOutput = {
        ...mockCommandOutput,
        $metadata: {
          ...mockCommandOutput.$metadata,
          remainingQuota: 10, // Below threshold of 50
        },
      }
      jest.mocked(mockXTokenRepo.getGuestToken).mockResolvedValue(undefined)
      jest.mocked(mockXTokenRepo.getCsrfToken).mockResolvedValue(csrfToken)
      jest
        .mocked(mockXApiClient.exec)
        .mockResolvedValue({ value: lowQuotaOutput, error: undefined })

      // Act
      await solution.process({ tweetId: '123' })
      const [quotaEvent] = solution.events.filter(
        event => event instanceof SolutionQuotaInsufficient
      )

      // Assert
      expect(quotaEvent).toBeDefined()
      expect(quotaEvent.remainingQuota).toBe(10)
    })

    it('should return no valid solution token when no tokens are available', async () => {
      // Arrange
      jest.mocked(mockXTokenRepo.getGuestToken).mockResolvedValue(undefined)
      jest.mocked(mockXTokenRepo.getCsrfToken).mockResolvedValue(undefined)

      // Act
      const result = await solution.process({ tweetId: '123' })

      // Assert
      expect(result.tweetResult.error).toBeInstanceOf(NoValidSolutionToken)
    })
  })
})
