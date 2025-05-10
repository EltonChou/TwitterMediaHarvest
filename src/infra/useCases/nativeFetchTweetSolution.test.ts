import { SolutionQuota } from '#domain/entities/solutionQuota'
import TweetSolutionQuotaChanged from '#domain/events/TweetSolutionQuotaChanged'
import TweetSolutionQuotaInsufficient from '#domain/events/TweetSolutionQuotaInsufficient'
import { ISolutionQuotaRepository } from '#domain/repositories/solutionQuota'
import { ITwitterTokenRepository } from '#domain/repositories/twitterToken'
import {
  InsufficientQuota,
  NoValidSolutionToken,
  TransactionIdProvider,
  TweetIsNotFound,
} from '#domain/useCases/fetchTweetSolution'
import { ResettableQuota } from '#domain/valueObjects/resettableQuota'
import { TwitterToken } from '#domain/valueObjects/twitterToken'
import FetchTweetSolutionId from '#enums/FetchTweetSolution'
import { ApiClient, FetchTweetError } from '#libs/XApi'
import { MockSolutionQuotaRepository } from '#mocks/repositories/solutionQuota'
import { MockXTokenRepository } from '#mocks/repositories/xToken'
import { toErrorResult, toSuccessResult } from '#utils/result'
import { generateTweet } from '#utils/test/tweet'
import { NativeFetchTweetSolution } from './nativeFetchTweetSolution'
import { faker } from '@faker-js/faker'

describe('NativeFetchTweetSolution', () => {
  const csrfToken = new TwitterToken({ name: 'ct0', value: 'csrf' })
  let solutionQuotaRepo: ISolutionQuotaRepository
  let xTokenRepo: ITwitterTokenRepository
  let xApiClient: ApiClient
  let solution: NativeFetchTweetSolution
  const transactionIdProvider: TransactionIdProvider = async (
    _path,
    _medthod
  ) => toSuccessResult('')

  beforeEach(() => {
    solutionQuotaRepo = jest.mocked(new MockSolutionQuotaRepository())
    xTokenRepo = jest.mocked(new MockXTokenRepository())
    xApiClient = jest.mocked(new ApiClient())

    solution = new NativeFetchTweetSolution(
      { solutionQuotaRepo, xTokenRepo, xApiClient },
      { quotaThreshold: 10, reservedQuota: 20 }
    )
  })

  describe('process', () => {
    it('should return error when no tokens available', async () => {
      jest.spyOn(xTokenRepo, 'getCsrfToken').mockResolvedValue(undefined)
      jest.spyOn(xTokenRepo, 'getGuestToken').mockResolvedValue(undefined)

      const result = await solution.process({
        tweetId: '123',
        transactionIdProvider: transactionIdProvider,
      })

      expect(result.error).toBeInstanceOf(NoValidSolutionToken)
    })

    it('should return insufficient quota error when quota is below reserved quota', async () => {
      jest.spyOn(xTokenRepo, 'getByName').mockResolvedValue(csrfToken)
      jest.spyOn(solutionQuotaRepo, 'get').mockResolvedValue(
        SolutionQuota.create(FetchTweetSolutionId.Native, {
          quota: new ResettableQuota({
            quota: 5,
            resetAt: faker.date.future(),
          }),
          isRealtime: false,
        })
      )

      const result = await solution.process({
        tweetId: '123',
        transactionIdProvider: transactionIdProvider,
      })

      expect(result.error).toBeInstanceOf(InsufficientQuota)
    })

    it('should not return insufficient quota error when quota is below reserved quota but it was reset', async () => {
      jest.spyOn(xTokenRepo, 'getCsrfToken').mockResolvedValue(csrfToken)
      jest.spyOn(xTokenRepo, 'getGuestToken').mockResolvedValue(undefined)
      jest.spyOn(solutionQuotaRepo, 'get').mockResolvedValue(
        SolutionQuota.create(FetchTweetSolutionId.Native, {
          quota: new ResettableQuota({
            quota: 5,
            resetAt: faker.date.past(),
          }),
          isRealtime: false,
        })
      )
      jest.spyOn(xApiClient, 'exec').mockResolvedValueOnce(
        toSuccessResult({
          tweetResult: toSuccessResult(generateTweet()),
          $metadata: {
            remainingQuota: 5,
            quotaResetTime: new Date(),
          },
        })
      )

      const result = await solution.process({
        tweetId: '123',
        transactionIdProvider: transactionIdProvider,
      })

      expect(result.error).toBeUndefined()
      expect(result.value).toBeDefined()
    })

    it('should emit quota changed event when valid quota metadata received', async () => {
      jest.spyOn(xTokenRepo, 'getCsrfToken').mockResolvedValue(csrfToken)
      jest.spyOn(xTokenRepo, 'getGuestToken').mockResolvedValue(csrfToken)
      jest
        .spyOn(xApiClient, 'exec')
        // The guest command should be failed first.
        .mockResolvedValueOnce(toErrorResult(new Error('Ignore')))
        .mockResolvedValueOnce(
          toSuccessResult({
            tweetResult: toSuccessResult(generateTweet()),
            $metadata: {
              remainingQuota: 20,
              quotaResetTime: new Date(),
            },
          })
        )

      await solution.process({
        tweetId: '123',
        transactionIdProvider: transactionIdProvider,
      })

      expect(solution.events).toContainEqual(
        expect.any(TweetSolutionQuotaChanged)
      )
    })

    it('should emit quota insufficient event when quota is low', async () => {
      jest.spyOn(xTokenRepo, 'getByName').mockResolvedValue(csrfToken)
      jest
        .spyOn(xApiClient, 'exec') // The guest command should be failed first.
        .mockResolvedValueOnce(toErrorResult(new Error('Ignore')))
        .mockResolvedValueOnce(
          toSuccessResult({
            tweetResult: toSuccessResult(generateTweet()),
            $metadata: {
              remainingQuota: 30,
              quotaResetTime: new Date(),
            },
          })
        )

      await solution.process({
        tweetId: '123',
        transactionIdProvider: transactionIdProvider,
      })

      expect(solution.events).toContainEqual(
        expect.any(TweetSolutionQuotaInsufficient)
      )
    })

    it('should return tweet not found for 404 errors', async () => {
      jest.spyOn(xTokenRepo, 'getByName').mockResolvedValue(csrfToken)
      jest
        .spyOn(xApiClient, 'exec')
        .mockResolvedValueOnce(
          toErrorResult(new FetchTweetError('Not Found', 404))
        )

      const result = await solution.process({
        tweetId: '123',
        transactionIdProvider: transactionIdProvider,
      })

      expect(result.error).toBeInstanceOf(TweetIsNotFound)
    })
  })
})
