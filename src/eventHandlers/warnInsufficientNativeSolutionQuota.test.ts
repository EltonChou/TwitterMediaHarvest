import { SolutionQuota } from '#domain/entities/solutionQuota'
import TweetSolutionQuotaInsufficient from '#domain/events/TweetSolutionQuotaInsufficient'
import { ResettableQuota } from '#domain/valueObjects/resettableQuota'
import FetchTweetSolutionId from '#enums/FetchTweetSolution'
import { getNotifier } from '#infra/browserNotifier'
import { MockEventPublisher } from '#mocks/eventPublisher'
import { MockSolutionQuotaRepository } from '#mocks/repositories/solutionQuota'
import { warnInsufficientNativeSolutionQuota } from './warnInsufficientNativeSolutionQuota'

describe('warnInsufficientNativeSolutionQuota', () => {
  const mockSolutionQuotaRepo = new MockSolutionQuotaRepository()

  const mockNotifier = getNotifier()

  const mockQuota = SolutionQuota.create(FetchTweetSolutionId.Native, {
    quota: new ResettableQuota({ quota: 10, resetAt: new Date() }),
    isRealtime: false,
  })

  const mockEvent = new TweetSolutionQuotaInsufficient('native', 5, new Date())

  const publisher = new MockEventPublisher()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should do nothing if no quota found', async () => {
    jest.spyOn(mockSolutionQuotaRepo, 'get').mockResolvedValueOnce(undefined)
    const mockSave = jest
      .spyOn(mockSolutionQuotaRepo, 'save')
      .mockResolvedValueOnce(undefined)
    const mockNotify = jest.spyOn(mockNotifier, 'notify')

    await warnInsufficientNativeSolutionQuota(
      mockSolutionQuotaRepo,
      mockNotifier
    )(mockEvent, publisher)

    expect(mockNotify).not.toHaveBeenCalled()
    expect(mockSave).not.toHaveBeenCalled()
  })

  it('should call warnBy when remaining quota > 0', async () => {
    jest.spyOn(mockSolutionQuotaRepo, 'get').mockResolvedValueOnce(mockQuota)
    const mockWarn = jest
      .spyOn(mockQuota, 'warnBy')
      .mockResolvedValueOnce(undefined)

    await warnInsufficientNativeSolutionQuota(
      mockSolutionQuotaRepo,
      mockNotifier
    )(mockEvent, publisher)

    expect(mockWarn).toHaveBeenCalled()
    expect(mockSolutionQuotaRepo.save).toHaveBeenCalledWith(mockQuota)
  })

  it('should notify directly when remaining quota is 0', async () => {
    const zeroQuotaEvent = new TweetSolutionQuotaInsufficient(
      'native',
      0,
      new Date()
    )
    jest.spyOn(mockSolutionQuotaRepo, 'get').mockResolvedValueOnce(mockQuota)
    const mockNotify = jest.spyOn(mockNotifier, 'notify')

    await warnInsufficientNativeSolutionQuota(
      mockSolutionQuotaRepo,
      mockNotifier
    )(zeroQuotaEvent, publisher)

    expect(mockNotify).toHaveBeenCalledOnce()
  })

  it('should log error if warning notification fails', async () => {
    const mockError = new Error('Notification failed')
    jest.spyOn(mockSolutionQuotaRepo, 'get').mockResolvedValueOnce(mockQuota)
    jest.spyOn(mockQuota, 'warnBy').mockResolvedValueOnce(mockError)
    const mockConsoleError = jest.spyOn(console, 'error')

    await warnInsufficientNativeSolutionQuota(
      mockSolutionQuotaRepo,
      mockNotifier
    )(mockEvent, publisher)

    expect(mockConsoleError).toHaveBeenCalledWith(
      'Failed to send quota warning notification.',
      mockError
    )
  })
})
