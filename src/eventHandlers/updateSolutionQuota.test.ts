import { SolutionQuota } from '#domain/entities/solutionQuota'
import TweetSolutionQuotaChanged from '#domain/events/TweetSolutionQuotaChanged'
import { ResettableQuota } from '#domain/valueObjects/resettableQuota'
import { MockEventPublisher } from '#mocks/eventPublisher'
import { MockSolutionQuotaRepository } from '#mocks/repositories/solutionQuota'
import { updateSolutionQuota } from './updateSolutionQuota'

describe('updateSolutionQuota', () => {
  const solutionQuotaRepo = new MockSolutionQuotaRepository()
  const handler = updateSolutionQuota(solutionQuotaRepo)
  const publisher = new MockEventPublisher()

  const event = new TweetSolutionQuotaChanged(
    'test-solution',
    100,
    new Date('2023-01-01T00:00:00Z')
  )

  beforeEach(() => {
    solutionQuotaRepo.clear()
    jest.resetAllMocks()
  })

  it('should create new quota if quota does not exist', async () => {
    const mockSave = jest.spyOn(solutionQuotaRepo, 'save')

    await handler(event, publisher)

    expect(mockSave).toHaveBeenCalledWith(expect.any(SolutionQuota))
  })

  it('should update existing quota if quota exists', async () => {
    const existingQuota = SolutionQuota.create('test-solution', {
      isRealtime: true,
      quota: new ResettableQuota({
        quota: 200,
        resetAt: new Date('2022-12-31T00:00:00Z'),
      }),
    })

    await solutionQuotaRepo.save(existingQuota)

    const mockSave = jest.spyOn(solutionQuotaRepo, 'save')
    mockSave.mockReset()

    await handler(event, publisher)

    expect(mockSave).toHaveBeenCalledWith(expect.any(SolutionQuota))
  })

  it('should handle zero quota updates', async () => {
    const zeroQuotaEvent = new TweetSolutionQuotaChanged(
      'test-solution',
      0,
      new Date('2023-01-01T00:00:00Z')
    )

    const mockSave = jest.spyOn(solutionQuotaRepo, 'save')

    await handler(zeroQuotaEvent, publisher)

    expect(mockSave).toHaveBeenCalledWith(expect.any(SolutionQuota))
  })
})
