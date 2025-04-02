import { SolutionQuota } from '#domain/entities/solutionQuota'
import TweetSolutionQuotaInsufficient from '#domain/events/TweetSolutionQuotaInsufficient'
import { ResettableQuota } from '#domain/valueObjects/resettableQuota'
import { getNotifier } from '#infra/browserNotifier'
import { MockEventPublisher } from '#mocks/eventPublisher'
import { MockSolutionQuotaRepository } from '#mocks/repositories/solutionQuota'
import { warnInsufficientNativeSolutionQuota } from './warnInsufficientNativeSolutionQuota'

describe('warnInsufficientNativeSolutionQuota', () => {
  const solutionQuotaRepo = new MockSolutionQuotaRepository()
  const notifier = getNotifier()
  const publisher = new MockEventPublisher()
  const handler = warnInsufficientNativeSolutionQuota(
    solutionQuotaRepo,
    notifier
  )

  const event = new TweetSolutionQuotaInsufficient(
    'native',
    100,
    new Date('2023-01-01T00:00:00Z')
  )

  beforeEach(() => {
    solutionQuotaRepo.clear()
    jest.resetAllMocks()
  })

  it('should create new quota and send notification if quota does not exist', async () => {
    const mockSave = jest.spyOn(solutionQuotaRepo, 'save')
    const mockNotify = jest.spyOn(notifier, 'notify')

    await handler(event, publisher)

    expect(mockSave).toHaveBeenCalledOnce()
    expect(mockNotify).toHaveBeenCalledTimes(1)
  })

  it('should use existing quota and send notification if quota exists', async () => {
    const existingQuota = SolutionQuota.create('native', {
      isRealtime: true,
      quota: new ResettableQuota({ quota: 200, resetAt: new Date() }),
    })

    await solutionQuotaRepo.save(existingQuota)

    const mockSave = jest.spyOn(solutionQuotaRepo, 'save')
    const mockNotify = jest.spyOn(notifier, 'notify')
    mockSave.mockReset()

    await handler(event, publisher)

    expect(mockSave).toHaveBeenCalledTimes(1)
    expect(mockNotify).toHaveBeenCalledTimes(1)
  })

  it('should handle notification error gracefully', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error')

    jest
      .spyOn(notifier, 'notify')
      .mockRejectedValueOnce(new Error('Notification failed'))

    const mockSave = jest.spyOn(solutionQuotaRepo, 'save')

    await handler(event, publisher)

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to send quota warning notification:',
      expect.any(Error)
    )
    expect(mockSave).toHaveBeenCalledOnce()
  })
})
